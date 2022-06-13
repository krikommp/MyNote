### Unity  SRP 操作

##### 说明

每个 RenderPass 对应于 RenderGraph 中一个结点

操作指令写入到 XXXTargetCommand 类中，它是一个继承自 CommandBuffer 的类。通过 XXXTargetCommand::Consturct() 方法来生成这个指令。他需要被 Add 到 BasePass 中的 m_renderCommands 队列中，最后 Execute 执行指令。

AddOutput(): 增加一个输出节点  

AddInput(): 增加一个输入节点

Construct  函数中编写 Command 操作顺序，即将 Command 按照顺序加入 RenderCommands 中

> 注：这段逻辑可以参见 RenderPathFramework.cs Render 函数

创建节点：

需要在：TaTPlugins -> blackjack-SRP -> Runtime -> RenderPass -> Render 下创建对应的 Pass 节点。注意写明各种参数。

在：TaTPlugins -> blackjack-SRP -> Editor-> RenderPass -> Render 下创建对应的 RenderPassEditor 类型，用于在 RenderGraph 中显示和编辑 Pass 参数。

> 注：RenderPassEditor  中的 AppendXXX 方法中的字符串需要对应于 Pass 中的 Get/SetParam 成员，不对应就获取不到。

##### 运行时修改参数

1. 需要一个继承自 `IParamsProvider` 的类型，用来存储参数
2. `RenderPass` 实现类需要同时继承 `RenderPass, IRuntimeConfigablePass<T>`
3. 需要在 `Renderpass/RenderSetting/` 路径下创建对应的 Setting 文件，例如指定在 Volume 下创建后效菜单

##### 指定输入输出贴图

- 指定输入贴图

  1. 通过 `AddInput` 函数可以简单的创建一个贴图的输入引脚
  2. 通过 ` new RenderTargetIdentifierResource.Identifier([texture string]);` 可以获取这个贴图的标识。将这个标识放入 Command 中，在 Command 中可以通过 m_resources 数组获取到贴图资源。

- 指定输出贴图

  针对需要创建出一个新的贴图输出的情况

  1. 新建 `RenderTargetIdentifierDesc` 和 `GraphicsFormat` 。前者用于描述这个输出贴图信息，后者是贴图颜色属性，需要根据系统支持来生成需要的颜色属性。
  2. 在 `RenderPass` 的构造函数中要把 `RenderTargetIdentifierDesc` 构造出来。
  3. Compile 函数中指定 `RenderTargetIdentifierDesc` 各项参数。

##### RenderPass 如何执行 Command

1. 首先每个 RenderPass 都需要拥有一系列的 Command 成员。
2. 在 Define 中 Command.New()
3. 在 RenderPass 的 Consturct 中 Add 到 RenderCommand 队列中。(需要将 m_executeCommandBufferCmd 加入表示想要执行之前加入的指令)
4. 每个 Command 都有 update 函数委托，用于运行时改变参数，可以将 Provider 参数在这里赋给 Command。

##### Tips

1. 在 RenderPass 中尽量使用已有的 Command 来组合完成操作
2. 算法部分如果有注释可以写上
3. RenderGraph 中的资源获取尽量使用 Resources 的方式来获取，保证可以在运行时获取到需要的资源
4. 如果需要输出 RenderTarget，那么需要创建一个 RenderTagret 节点作为输入输出，不需要手动创建 RenderTargetIdentifierDesc 类型

### Lens Distortion

##### 实现方式

1. UE 中的实现方式

   - 位置

     LensDistortion 插件/ Opencv LensDistortion 插件

   - 目的

     生成 lens distortion 和 undistortion 的 uv 贴图，在后效shader中采样贴图改变uv。

     可以预计算出贴图，然后直接在 PostProcess 中采样改变 uv 即可，可以减少计算消耗。

   - 说明

     1. LensDistortion 插件

        这个算法需要给定一个 RenderTarget，在 shader 中同时生成 distortion 和 undistortion 采样图。

        算法输入参数不太直观。

     2. Opencv LensDistortion 插件

        与之前的 Lens Distortion 插件相同，都是为了输出 distortion 和 undistortion 采样图。添加了相机标定的函数，主要是为了 undistortion 的正确性。

        这个算法需要引入 opencv 库，步骤比较繁琐。

2. Unity 中实现方式

   - 位置：

     urp 管线中的 PostProcess 部分。可以在 UberPostProcess 中找到相关代码。

   - 目的：

     直接计算出uv偏移后的结果

   - 说明

     该算法在 shader 中实时计算出偏移后的uv位置，给出的参数比较直观。

     缺点是需要每次渲染计算一次，可能会产生一定的消耗。

     > 也可以改进成预计算出一张位移贴图，然后在后效 pass 中采样贴图，获取 distortion 后的位置。

##### 相关链接

[理解Lens Distortion](https://shotkit.com/lens-distortion/)

[UE Lens Distortion Api文档](https://docs.unrealengine.com/4.27/en-US/BlueprintAPI/LensDistortion_1/)

[如何在UE中使用Lens Distortion](https://www.unrealengine.com/zh-CN/tech-blog/camera-calibration-distortion-simulation-and-correction-in-ue4?sessionInvalidated=true)

[Unity 中的 Lens Distortion](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@7.1/manual/Post-Processing-Lens-Distortion.html)

[畸变参数模拟](https://kamino410.github.io/cv-snippets/camera_distortion_simulator/)



