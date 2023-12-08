# 1. 基础
首先，需要简单介绍一下 Unreal Engine 中与渲染相关的结构:

| 类型 | 解析 |
| --- | --- |
| UPrimitiveComponent | 图元组件，是所有可渲染组件的基础，也是CPU层裁剪的最小粒度 |
| FPrimitiveSceneProxy | 是 UPrimitiveComponent 在渲染线程中代理类，持有 UPrimitiveComponent 的渲染数据 |
| FPrimitiveSceneInfo | 融合了 UPrimitiveComponent 和 FPrimitiveSceneProxy，只在渲染线程中存在 |
| FScene | UWorld 的代理，只有加入到 FScene 中的物体才会被渲染出，渲染线程持有 FScene 的所有状态 |
| FSceneView | 代表 FScene 中的每一个视口，在一个 FScene 中可以存在多个 view, 每帧创建 |
| FViewInfo | FSceneView 在渲染线程中的表示 |
| FSceneRenderer | 每帧都会被创建，在引擎中有 延迟管线 和 移动管线 两种实现 |
| FMeshBatchElment | 每个模型网格的数据，持有顶点，索引以及UniformBuffer |
| FMeshBatch | 存有一组 FMeshBatchElement, 这组 Element 拥有相同的材质和顶点缓冲 |
| FMeshDrawCommand | 描述了 Pass Draw Call 的状态和数据，例如Shader绑定，顶点数据，索引数据，PSO缓存 |   
| FMeshPassProcessor | 网格渲染处理器，将场景中感兴趣的网格对象处理，将 FMeshBatch 转成一个或多个 FMeshDrawCommand |

# 2. 渲染流程