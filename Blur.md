#### SSAO

##### 什么是SSAO

1. 说明

   AO 是指环境遮蔽，对场景中的一个点，用一个标量表示这个点向各个方向射出的光线被遮挡的概率，而SSAO顾名思义就是在屏幕空间实现这种AO算法。相比较AO，它可以被运用到实时计算中，交与GPU计算，并且可以集成到现代管线中。

   > 遮挡
   >
   > 判断场景点 A 有没有被场景点 B 遮挡，首先判断 AB 向量是否与 A 出射光线（法线）同侧，如果同侧，那么夹角越小，遮挡程度越大，如果不同测，那么就不会产生遮挡。同时两点的距离越小，遮挡的贡献越大。

2. 公式
   $$
   A_{p}(\vec{n}) = 1 - \frac{1}{\pi}\int_{\Omega}V_{p}(\vec{\omega})(\vec{n}\vec{\omega})\mathrm{d}\omega
   $$

   其中

   Ω 是沿法线方向上的半球积分

   d(ω ) 是 p 点到其沿ω方向与场景的第一个交点的距离

   V( ω) 是距离衰减函数衰减函数从 1 开始衰减并在某个固定距离下衰减到 0

##### 如何计算SSAO

1. 将屏幕空间中的每一个像素转化到世界空间下的一点 p
2. 在以 p 为球心，R 为半径的球体（若有法线缓存则为法线方向的半球体）中，随机取若干三维采样点。
3. 将采样的三维点投影到深度缓存上，求出投影点，用来代表采样点的遮蔽。
4. 计算所有采样点的平均遮蔽。

> 1. 如何计算每个点的遮蔽值
>
>    每个遮蔽者的遮挡贡献取决于两个因素
>
>    1. 到被遮挡者的距离
>    2. 被遮挡者法线与两者之间的夹角
>

##### Blur

1. Box Blur

   针对每一个像素，执行相同的步进进行采样，叠加，最后求平均可以得到Blur后的结果。

   ```glsl
   // pass 1
   vec4 frag(v2f i) : SV_TARGET {
       // init color
       vec4 col = 0;
       // iterate over blue sample
       for (float index = 0; index < SAMPLES; ++index) {
           // calculate sample point
           // subtract 0.5 for uv form -0.5 to 0.5
           vec2 uv = i.uv + vec2(0, (index / (SAMPLES - 1)) - 0.5) * _BlurSize);
           // add color 
           col += tex2D(_MainTex, uv);
       }
       // divide samples time for average color
       return col / SAMPLES;
   }
   
   // pass 2
   vec4 frag(v2f i) : SV_TARGET {
       //calculate aspect ratio
       float invAspect = _ScreenParams.y / _ScreenParams.x;
       vec4 col = 0;
       for (float index = 0; index < SAMPLES; ++index) {
           // for square sample multiply by a aspect ratio
           vec2 uv = i.uv + vec2(((index / (SAMPLES - 1)) - 0.5) * invAspect * _BlurSize, 0);
           // add color
           col += tex2D(_MainTex, uv);
       }
       return col / SAMPLES;
   }
   ```

   >  上面是针对y轴进行了一次Blur，是O(n)的
   >
   > 如果再对x轴进行此一Blur，那么整体复杂度将会是O(n ^ 2)为了降低复杂度，可以通过增加一个Blur Pass，使用两个pass分别进行blur 。

2. Gaussian Blur

   Box Blur 给予了靠近中心点像素一个较低的权重值，可能会导致模糊效率不佳。

   我们可以计算出每一个像素的权重，通过 gaussian function
   $$
   G(x) = \frac{1}{\sqrt{2\pi\sigma^2}}e^{-\frac{x^2}{2\sigma^2}}
   $$
   因此需要中心点偏移距离x

   以及标准差  $\sigma$ 
   
   ```C++
   float _StandardDeviation;
   float _BlurRadius;
   #define PI 3.14159265359
   #define E 2.71828182846
   
   float4 frag(v2f i) : SV_TARGET {
       // 避免除0
       if (_StandardDeviation == 0) {
           return tex2D(_MainTex, i.uv);
       }
       float4 col = 0;
       float sum = 0;
       for (int index = 0; index < SAMPLES; ++index) {
           float offset = (index / (SAMPLES - 1) - 0.5) * _BlurRadius;
           float2 uv = float2(0, offset);
           // 计算高斯分布函数
           float stDevSquared = _StandardDeviation * _StandardDeviation;
           float gauss = (1 / sqrt(2 * PI * stDevSquared)) * pow(E, -((offset * offset) / (2 * stDevSquared)));
           
           // 每个采样点都乘以各自的高斯分布，即加权
           col += tex2D(_MainTex, uv) * gauss;
           
           // 由于加权最后需要为一，所以在所有像素点计算完毕之后需要除以加权总和
           sum += guss;
       }
       col /= sum;
       return float4(col, 1.0);
   }
   ```
   
   1. 卷积核
   
      相当于对某个局部进行加权求和的过程，一般卷积核大小为 $1\times1$，$3\times3$ 等奇数 X 奇数的形式。（使用奇数是因为想要一个中心）
   
      > 如上方所示，求解高斯分布的过程就相当于求解卷积核，针对每一个offset都求解出一个对应的特征值。这里进行了9次计算，实际上可以通过在CPU阶段将卷积核计算好，然后传递到GPU中，避免重复计算。
   
3. 常用的Blur卷积核整理

   1. 中值滤波器
   
      - 基本思想
   
        中值滤波是把数字图像或数字序列中一点的值用该点一个邻域中各点值的中值代替，让周围的像素更接近真实值。
   
   2. 均值滤波器
   
      - 基本思想
   
        用当前像素点周围N*N个像素的均值来代替当前像素值
   
   3. 高斯滤波器
   
      - 基本思想
   
        高斯分布
   
   4. 圆形卷积
   
      ```python
      def circleAverage(center, r = 4):
          """
          """
          for i in range(center[0]-r, center[0]+r):
              for j in range(center[1]-r, center[1] + r):
                  if (center[0] - i) ** 2 + (center[1] - j) ** 2 <= r**2:
                      // do your computation here.
      ```
   
   5. 泊松分布
   
      - 概率密度函数 / 概率质量函数
        $$
        P(X = k) = \frac{\exp^{-\lambda}\lambda^{k}}{k!}
        $$
   
   6. 柯西分布
      $$
      f(x) = \frac{1}{\pi} * \frac{b}{b^2 + (x - a) ^ 2}
      $$
   
   7. 卡方分布
   

##### 一些测试

```C#
         public abstract class BlurKernelBase
        {
            public KernelType m_kernelType;
            public int m_kernelSize;
            public float m_kernelRadius;
            protected List<Vector4> m_filterVectorArray;
            public abstract void GeneratorKernel();
            public abstract void SetKernelToCmd(CommandBuffer cmd);
        }

        public class GaussianBlurKernel : BlurKernelBase
        {
            public float m_varialce;
            private float[] m_kernel;

            public GaussianBlurKernel(float factor, int halfKernelSize, float offset)
            {
                m_varialce = Mathf.Lerp(0.1f, 8.0f, factor);
                m_kernelSize = halfKernelSize;
                m_kernelRadius = offset;
                m_kernel = new float[(2 * m_kernelSize + 1)];
                m_filterVectorArray = new List<Vector4>();
                m_kernelType = KernelType.Box;
            }

            public override void GeneratorKernel()
            {
                m_filterVectorArray.Clear();
                for (int j = 0; j <= m_kernelSize; ++j)
                {
                    m_kernel[m_kernelSize + j] = m_kernel[m_kernelSize - j] = GaussianValue(j, m_varialce);
                }
                float sum = 0.0f;
                for (int j = 0; j < m_kernel.Length; ++j)
                {
                    sum += m_kernel[j];
                }
                for (int j = 0; j < m_kernel.Length; ++j)
                {
                    m_kernel[j] /= sum;
                }
                
                int count = m_kernel.Length;
                for (int i = 0; i < count; i += 4)
                {
                    float x = i < count ? m_kernel[i] : 0;
                    float y = (i + 1) < count ? m_kernel[(i + 1)] : 0;
                    float z = (i + 2) < count ? m_kernel[(i + 2)] : 0;
                    float w = (i + 3) < count ? m_kernel[(i + 3)] : 0;
                    m_filterVectorArray.Add(new Vector4(x, y, z, w));
                }
            }

            public override void SetKernelToCmd(CommandBuffer cmd)
            {
                cmd.SetGlobalVectorArray(ShaderIds.m_kernelArray, m_filterVectorArray);
                cmd.SetGlobalVector(ShaderIds.m_blurKernelParam, new Vector4(m_kernelSize, m_kernelRadius, 0, 0));
            }
            
            public float GaussianValue(float x, float varialce)
            {
                return 0.39894f * Mathf.Exp(-0.5f * x * x / (varialce * varialce)) / varialce;
            }
            
            protected static class ShaderIds
            {
                public static readonly int m_kernelArray = Shader.PropertyToID("_FilterVectorArray");
                public static readonly int m_blurKernelParam = Shader.PropertyToID("_BlurKernelParam");
            }
        }

        public class CircleKernel : BlurKernelBase
        {
            public CircleKernel(int halfKernelSize, float radius)
            {
                m_kernelSize = halfKernelSize;
                m_kernelRadius = radius;
                m_filterVectorArray = new List<Vector4>();
                m_kernelType = KernelType.Circle;
            }

            public override void GeneratorKernel()
            {
                UpdateRoteUV(m_kernelSize * 2);
            }

            public override void SetKernelToCmd(CommandBuffer cmd)
            {
                cmd.SetGlobalVectorArray(ShaderIds.m_circleFilterVectorArray, m_filterVectorArray);
                cmd.SetGlobalVector(ShaderIds.m_blurKernelParam, new Vector4(m_kernelSize, m_kernelRadius, 0, 0));
            }
            
            Vector2 GetRotatedUV(float theta, Vector2 originUV)
            {
                var sin = Mathf.Sin(theta);
                var cos = Mathf.Cos(theta);
                var rotMatC0 = new Vector2(cos, -sin);
                var rotMatC1 = new Vector2(sin, cos);
                var x = Vector2.Dot(rotMatC0, originUV);
                var y = Vector2.Dot(rotMatC1, originUV);
                return new Vector2(x, y);
            }

            void UpdateRoteUV(int count)
            {
                m_filterVectorArray.Clear();

                var theta = Mathf.PI * 2 / count;
                for (var i = 0; i < count; i += 2)
                {
                    var xy = GetRotatedUV(i * theta, Vector2.right);
                    var zw = GetRotatedUV((i + 1) * theta, Vector2.right);
                    m_filterVectorArray.Add(new Vector4(xy.x, xy.y, zw.x, zw.y));
                }
            }
            private static class ShaderIds
            {
                public static readonly int m_circleFilterVectorArray = Shader.PropertyToID("_FilterVectorArray");
                public static readonly int m_blurKernelParam = Shader.PropertyToID("_BlurKernelParam");
            }
        }
```
##### 实现思路

仿照了圆形卷积的实现方式，为 BoxKernel 加入了 Offset 变量作为每个核之间的间距

可以通过调节这个间距来扩展核的半径，使核能够采样到更远距离的像素值

##### 代码位置

- HLSL 代码  
ShaderLibrary/Runtime/ShaderLab/PostProcessing/BlurKernel.hlsl
- SRP　代码   
SRP/Runtime/RenderResource/RenderCommand.cs

##### 使用方式

1. 在需要使用的Shader中 include BlurKernel.hlsl 文件
2. 需要定义宏，目前的宏有 `BJ_CIRCLE_FILTER_8` `BJ_CIRCLE_FILTER_16` `BJ_BOX_FILTER`
3. 在对应的 Pass 文件中，加入 `BlurKernelCommand`  
   ```C#
   // 定义
   private BlurKernelCommand m_blurKernelCommand;

   // Define 函数中
    protected override void Define() {
        // do something
        m_blurKernelCommand = BlurKernelCommand.New();
        // do something
    }

    // Construct 中
    protected override void Construct()
    {
        // do something
        m_renderCommands.Add(m_blurKernelCommand);
        // do something
    }

    // Compilez中
    protected override void Compile(ref FrameData frameData)
    {
        // do something
        m_blurKernelCommand.Construction(lensDistSrcTexIdentifier, BlurKernelCommand.KernelType.CircleX8, 3, m_cmdId);
        // do something
    }

   ```

##### Link

[通过深度图构建法线](https://atyuwen.github.io/posts/normal-reconstruction/)

[关于Gaussian Blur](https://www.ronja-tutorials.com/post/023-postprocessing-blur/#1d-blur)

[图像处理中滤波器](https://www.cnblogs.com/Liu-xiang/p/10259861.html)

[16种常见概率分布概率密度函数](https://max.book118.com/html/2020/1013/8036142113003005.shtm)

[常见分布及其概率分布图](https://blog.csdn.net/Wisimer/article/details/90029791)

