## 1. 线程组
一个线程组在一个流多处理器(Stream Multiprocessor, SM) 上执行。一个 SM 上至少需要两个或两个以上的线程租，因为 SM 可以通过切换不同的线程组来实现隐藏阻塞。
每一个线程组都有一个共享内存 (Shared Memory), 这个线程组中的所有线程都可以访问这部分内存。但是跨线程组的线程是不能相互访问各自的内存的，所以同步操作只能在一个线程组内完成，不能跨线程组。
一个线程组又是由多个线程组成的，线程组中的线程数量就是通过 `numthreads(tx, ty, tz)` 来指定

## 2. numthreads
在这里设置的参数主要是设定一个线程组中的活动线程数量
例如：对于 NV，线程组中的线程被划分为了一个 wrap, 而一个 wrap 里管理了 32 个线程。因此当 SM 调度线程组时，wrap 会让这 32 个线程同时执行同一条指令。

所以如果设置 numthreads 活动线程数量为 10 个，那么就会出现另外 22 个线程是空闲的，这样会浪费资源。
因此对于 NV 来说，推荐总是设置 numthreads 为 32 的倍数。
对于 AMD 来说，线程被划分为一个 Wavefront, 一个 Wavefront 里管理了 64 个线程。所以同样的，推荐总是设置 numthreads 为 64 的倍数。

> 在Direct3D12中，可以通过ID3D12GraphicsCommandList::Dispatch(gX,gY,gZ)方法创建gX*gY*gZ个线程组。注意顺序，先numthreads定义好每个核函数对应线程组里线程的数量（tX*tY*tZ），再用Dispatch定义用多少线程组(gX*gY*gZ)来处理这个核函数。

> 总结一下：在 CPU 侧通过 RHI 来 Dispatch 的是指定线程组的数量，而在 GRU 侧通过 numthreads 来指定线程组中的线程数量。
> 例如 Dispatch(5, 3, 2) 表示需要 GPU 创建 5*3*2 = 30 个线程组， 而 numthreads(10, 8, 3) 表示对于每一个线程组需要调用 10*8*3 = 240 个线程。

## 3. ComputeShader 核函数中参数
SV_GroupThreadID: 当前线程在线程组中的索引
类型：int3
例如：对于 Dispatch(5, 3, 2)，numthreads(10, 8, 3) 声明中。我们取 (7, 5, 0)，表示在某一个线程组中的某个线程的位置

SV_GroupID: 当前线程组在整个调度中的索引
类型：int3
例如：对于 Dispatch(5, 3, 2)，numthreads(10, 8, 3) 声明中。我们取 (2, 1, 0)，表示某个线程组的位置

SV_DispatchThreadID: 当前线程在整个调度中的索引
类型：int3
例如：我们已知线程组位置 (2, 1, 0) 以及线程位置 (7, 5, 0) 以及这个线程组大小 (10, 8, 3)，就可以计算出这个线程的实际位置 ([(2, 1, 0) * (10, 8, 3)] + (7, 5, 0)) = (27, 13, 0)

SV_GroupIndex: 当前线程在这个线程组中的索引位置
类型：int
例如：我们已知线程位置 (7, 5, 0) 以及这个线程组大小 (10, 8, 3)，就可以计算得出 (7, 5, 0) 在这个线程组中的索引位置 7 + 5 * 10 + 0 * 10 * 8 = 57

## 4. 声明核函数
在 HLSL 中声明核函数的方式是使用 `[numthreads(tx, ty, tz)]` 关键字，例如：
```hlsl
void KernelFunction(uint3 groupId : SV_GroupID,
uint3 groupThreadId : SV_GroupThreadID,
uint3 dispatchThreadId : SV_DispatchThreadID,
uint groupIndex : SV_GroupIndex)
{
    
}
```
上面的参数数量可以被缺省，可以根据需要声明一个或多个参数，但是这些参数的名称必须是 SV_GroupID, SV_GroupThreadID, SV_DispatchThreadID, SV_GroupIndex 中的一个或多个，且类型要保持一致。

下面以一个 1024 * 1024 的图片为例，讨论我们如何确定线程组个数以及线程组内现成的数量。
假设我们希望 numthreads(8, 8, 1), 那么就需要 (1024 / 8, 1024 / 8, 1 / 1) 个线程组来处理了
这样我们每一个核函数就针对图片中的一个像素

## 5. 常用的交互方式和结构
RWTexture2D<T>：
表示一个可读写纹理。需要在 CPU 侧创建出一个 Texture2D 对象并设置为可被读写，然后传入 CS
```csharp
RenderTexture mRenderTexture = new RenderTexture(256, 256, 16);
mRenderTexture.enableRandomWrite = true;
mRenderTexture.Create();

computeShader.SetTexture(kernelIndex, "Result", mRenderTexture);
```
```hlsl
RWTexture2D<float4> Result;
```

RWStructuredBuffer<T>:
可被读写且连续的缓冲区，这里的 T 可以是自定义的结构体，常用于模拟 List 行为。
```csharp
public struct ParticleData
{
    public Vector3 pos;//等价于float3
    public Color color;//等价于float4
}

// 需要指定内存区域大小和数量
mParticleDataBuffer = new ComputeBuffer(mParticleCount, 28);
ParticleData[] particleDatas = new ParticleData[mParticleCount];
mParticleDataBuffer.SetData(particleDatas);

// 传入 CS
computeShader.SetBuffer(kernelId, "ParticleBuffer", mParticleDataBuffer);
```

更多结构：
之前我们创建 ComputeBuffer 时默认使用的是 Default，但是还有其他的结构可以使用，例如：
| 结构 | 说明 |
| --- | --- |
| Default | 默认类型，对应 StructuredBuffer\RWStructuredBuffer, 主要用于 struct 传递 |
| Raw | byte 类型，常用于寻址，对应ByteAddressBuffer\RWByteAddressBuffer |
| Append | 模拟栈结构，可以动态添加或删除元素，对应AppendStructuredBuffer\ConsumeStructuredBuffer |
| Counter | 计数器 |
| Constant | 该buffer可以被当做Shader.SetConstantBuffer和Material.SetConstantBuffer中的参数 |
| Structured | 单独使用时等价于 Default |
| IndirectArguments | 被用作 Graphics.DrawProceduralIndirect，ComputeShader.DispatchIndirect或Graphics.DrawMeshInstancedIndirect这些方法的参数。buffer大小至少要12字节，DX11底层UAV为R32_UINT，SRV为无类型的R32。|
* 注：Default，Append，Counter，Structured对应的Buffer每个元素的大小，也就是stride的值应该是4的倍数且小于2048。

## 6. UAV
UAV 是 Unordered Access View 的缩写，表示无序访问视图。这个视图可以让我们在 CS 中对资源进行读写操作。
通常我们接触到的 Texture2D 是一个 SRV (Shader resource view)，表示资源不可被写，但是在 CS 侧我们经常需要对一个 buffer 进行读写操作。并且这个读写操作要是无序的，因为要支持大量线程同时访问。

因此之前使用到的 RWTexture 以及 RWStructedBuffer 都是属于 UAV 类型的资源。

## 7. groupshared
用于声明一个被放置于共享内存中的对象，同一个线程组的线程可以访问这个共享内存，但是不同线程组之间无法相互访问，每个线程组都维护了一份自己的共享内存。

* Direct3D 11以来，共享内存支持的最大大小为32kb（之前的版本是16kb），并且单个线程最多支持对共享内存进行256byte的写入操作。

## 小结
- 如果我们想在 CS 中获取一个唯一的线程ID，可以使用 SV_GroupID.x * numthreads(这个线程组大小) + SV_GroupIndex 来获取。(当然，这个计算成立的条件是 Dispatch 出来的线程组大小是 (X, 1, 1) 的形式)