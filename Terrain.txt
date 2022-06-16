PlayerMode 模式：
RepaintController::RenderPlayModeViewCameras
GetRenderManager().RenderCameras()
// 这里会根据 SRP 是否开启决定渲染方式
if (!RenderCamerasWithScriptableRenderLoop(display)) {
// do something....
// 内置渲染管线
DoRenderScreenCamera(camera, preImageEffectsPerCameraCall, postImageEffectsPerCameraCall);

}

RenderManager::RenderCamerasWithScriptableRenderLoop() {
	if (!ScriptableRenderContext::ShouldUseRenderPipeline())
		return false;
	dynamic_array<Camera*> cameras(kMemTempAlloc);
	FillValidSRPCamerasFromSource(cameras, GetOnscreenCameras(), displayId);

	RendererScene& scene = GetRendererScene();
	scene.BeginCameraRender();
	ScriptableRenderContext renderContext;
	renderContext.ExtractAndExecuteRenderPipeline(cameras);
	scene.EndCameraRender();

	return true;
}

DoRenderScreenCamera(...) {
	if (cam->GetStereoEnable()) {
		// VR 相关
	}else {
		// Regular rendering path: cull, then render
		CullResult cullResult;
		if (cam->GetEnable()) {
			cam->Culling(cullResult);
		}
		if (cam->GetEnable()) {
			cam->UpdateVelocity();
			cam->Render(cullResults, GetDefaultPassContext(), Camera::kRenderFlagSetRenderTarget, preImageEffectsPerCameraCall, postImageEffectsPerCameraCall);
		}
	}
} 

Camera::Cull() {
	// do something....
	CustomCull(...);
}

Camera::CustomCull(...) {
	ITerrainManager* terrianManager = GetITerrianManager();
	if (terrainManager != NULL && cullingCameraParameters.cullingMask != 0) {
		results.terrainCullData = terrainManager->CullAllTerrains(cullingCameraParameters);
	}
}

// 地形渲染路径
TerrainManager::CullAllTerrains() {
	// ....
}




EditorMode 模式：
Camera::RenderEditorCamera(...) {
	if (GetCameraType() == VR && GetStereoEnabled()) {
		// do somethings
		// 可能是和VR设备有关的渲染设置
	}else {
		// 普通模式下相机渲染路径
		RenderEditorCamera();
	}
} 

Camera::RenderEditorCamera(...) {
	// 判断是否使用C++内置渲染管线
	// 如果配置了可编程渲染管线，那么将会调用 C# 层的 `DoRenderLoop_Internal` 函数 进入可编程管线的渲染流程
	const bool useCustomPipeline = ExecuteCustomRenderPipeline(drawMode, gridParam, renderFlags);
	if (useCustomPipeline ) {
		GetRendererScene().EndCameraRender();
	}else {
		cullingCamera->CustomCull(...);	
	}
}

Camera::CustomCull(...) {
	ITerrainManager* terrianManager = GetITerrianManager();
	if (terrainManager != NULL && cullingCameraParameters.cullingMask != 0) {
		results.terrainCullData = terrainManager->CullAllTerrains(cullingCameraParameters);
	}
}

// 地形渲染路径
TerrainManager::CullAllTerrains() {
	// ....
}

-- SRP 渲染地形
1. 为 Terrain 附上材质

// 内部函数调用，当点击更换地形材质时触发
// TerrainBindings.gen.cpp ---- Line 1614
Terrain_Set_Custom_PropMaterialTemplate(...) 
	// Terrain.cpp --- Line 313
	->SetMaterialTemplate(...)
	{
		// 更新材质信息
		UpdateSplatDatabaseUserRegistration();
		{
			// 省略部分
			m_SplatMaterials->ResetVersions();
			// 将旧的材质从 m_SplatMaterialDataUsers 队列中删除
			terrainData->GetSplatDatabase().UnregisterSplatMaterialData(m_RegisteredMaterial);
			// 更新新的材质到 m_SplatMaterialDataUsers  
			terrainData->GetSplatDatabase().RegisterSplatMaterialData(material);
			{
				// SplatDatabase.cpp --- Line 107
				// 省略...
				// 将新的 Material 加入到 m_SplatMaterialDataUsers，并进行一些初始化操作，例如计算引用次数
				dynamic_array<const TerrainLayer*> terrainLayerPtrs(m_TerrainLayers.size(), kMemTempAlloc);
				for (size_t i = 0, n = m_TerrainLayers.size(); i < n; ++i)
					terrainLayerPtrs[i] = m_TerrainLayers[i];
				dynamic_array<Texture*> alphaTexturePtrs(m_AlphaTextures.size(), kMemTempAlloc);
				for (size_t i = 0, n = m_AlphaTextures.size(); i < n; ++i)
					alphaTexturePtrs[i] = m_AlphaTextures[i];
				Vector2f terrainSize(m_TerrainData->GetHeightmap().GetSize().x, m_TerrainData->GetHeightmap().GetSize().z);

				// 计算新 SplatShader 属性
				
				user.materialData.InitializeWithSplatShaders(SplatShaderSet(material));
				{
					1. SplatShaderSet(material) 
					{
						// SplatMaterialData.cpp --- Line 30
						// SplatShaderSet 初始化会根据 Shader 的 Dependency 属性，获取 SplatShaderPass
						// 对于Nature/TerrainLit 会拥有 AddPass 通道，支持多层级
						Shader* shader = material != NULL ? material->GetShader() : NULL;
						(*this)[kSplatShaderFirstPass] = shader != NULL ? shader : Shader::GetDefault();
						(*this)[kSplatShaderAddPass] = shader != NULL ? shader->GetDependency("AddPassShader") : NULL;
						(*this)[kSplatShaderBaseMap] = shader != NULL ? shader->GetDependency("BaseMapShader") : Shader::GetDefault();
						(*this)[kSplatShaderBaseMapGen] = ::FindBaseMapGenShader(shader);
						// 计算每个 pass 支持的 Splat 层级数量
						// 可以在 Tags 中写明 SplatCount 标签即 需要的 Splat 数量，建议为 SplatStaticVars::kSplatsPerControl(4) 的整数倍
						splatsPerPass = GetSplatCountFromTag(shader != NULL ? shader->GetShaderLabShader()->GetTag(GetSplatStaticVars().kTagIDSplatCount, false) : ShaderTagID::Invalid(), shader);
					}
					{
						
					}
				}
			}
			m_RegisteredMaterial = material;
		}
	}

2. 创建及删除 SplatAlpha Texture
LayerIndexTexture 和 LayerWeightTexture 的创建与销毁和 alphaTextures 保持一致

创建
1. 当 Terrain 被创建出来时
TerrainDataScriptingInterface::Create(...)
	-> TerrainData->AwakeFromLoad(kInstantiateOrCreateFromCodeAwakeFromLoad)
		{
			// 分别进行地形每个模块的 AwakeFromLoad
			m_SplatDatabase.AwakeFromLoad(awakeMode);	// alpha map 初始化的地方
			-> SplatDatabase::AwakeFromLoad(...) 
			-> SplatDatabase::CheckConsistency
			{
				1. 根据 actual 分辨率重新计算 alpha map 的分辨率。
				由于希望 LayerIndexTexture 和 LayerWeightTexture 与 alpha map 保持一致
				因此这里也需要根据计算出来的分辨率修改这两张贴图
				2. 分配贴图空间
				当移除了一些Splat texture，需要确保 alpha map 也被销毁
				当用户进行 undo 操作，也需要重新分配 alpha map 空间
				SplatDatabase::ResizeAlphaTextureArray()

			}
			
		}

// 当创建一层 TerrainLayer 时会调用该方法
// TerrainDataScriptingInterface.cpp	---	Line 344
TerrainDataScriptingInterface::SetTerrainLayersRegisterUndo(...)
	// SplatDatabase.cpp	---	Line 593
	-> SplatDatabase::SetTerrainLayersRegisterUndo(...)
		// 会根据当前的 TerrainLayer 层数创建
		// 判断条件是：将当前层数与 SplatStaticVars::kSplatsPerControl(4) 进行计算，每多4层就会需要多一张 AlphaMap
		// 会保证 m_AlphaTextures 与实际需要的 AlphaMap 数量一致，不足的将进行创建，多余的会被删除
		-> SplatDatabase::ResizeAlphaTextureArray(...)


// 删除
1. 记录
	可能有关的函数
	ResizeAlphaTextureArray()



3. 绘制地形贴图
// 由 c# 端完成地形贴图绘制流程
// C++ 端只需要在每次update更新传递过去的texture信息就可以
	1. 绘制
		绘制开始：
		// TerrainPaintUnitility.cs	---	Line 222
		public static PaintContext BeginPaintTexture(...) {
			// 进行一些绘制的初始化操作，会从 Alphamap 中拿到一张 sourceTexture 作为输入数据
			// 创建本次绘制需要的 sourceTexture 以及 destinationTexture
			PaintContext ctx = InitializePaintContext(...);
			ctx.GatherAlphamap(...);
			return ctx;
		}

		// 


		绘制进行中：
		需要用到的 PaintHeight.shader，这个 shader 用来根据传递过来的画刷信息绘制出一张画板图
		// PaintTextureTool.cs	---	Line 44
		public override bool OnPaint(Terrain terrain, IOnPaint editContext) {
			// 绘制函数 省略部分 ...
			// 计算画刷属性，并将这些属性写入材质中
			// sourceRenderTexture 是画刷自带的画笔贴图，可以从中获取到不同画刷的权重值
			// destinationRenderTexture 是最终根据画刷大小，强度等信息计算出来的实际权重值贴图(最大值不会超过1.0)
			Graphics.Blit(paintContext.sourceRenderTexture, paintContext.destinationRenderTexture, mat, (int)TerrainBuiltinPaintMaterialPasses.PaintTexture);
			// 计算出这张贴图后，会进入到后续绘制过程
			TerrainPaintUtility.EndPaintTexture(paintContext, "Terrain Paint - Texture");
			return true;
		}
		
		// PaintContext.cs		---	Line 536
		public void ScatterAlphamap(string editorUndoName) {
			// 获取 SplatTexture, 根据画刷的 Texture, 绘制出混合后的权重图	
			// 通道遮罩，不同的 Terrain Layer 将会渲染到不同的通道上
			Vector4[] layerMasks = { new Vector(1, 0, 0, 0), new Vector(0, 1, 0, 1), new Vector(0, 0, 1, 0), new Vector(0, 0, 0, 1) };	
			// 省略...
			// 创建了一个临时 Texture, 作为接下来渲染的 RenderTarget
			SatterInternal(t => {
				// ...
				// 地形 SplatTexture 索引值
				// 通过计算获取，根据当前绘制的层数，得到需要在哪张Alphamap上绘制
				int targetAlphamapIndex = userData.mapIndex;
				// 需要渲染到的通道索引
				int targetChannelIndex =userData.channelIndex; 
				// ...
				// 遍历所有的 alphamaps 并进行修改
				for (int i = 0; i < t.terrain.terrainData.alphamapTextureCount; i++) {
					// 省略部分... 考虑只有一层 Alphamap 时
					RenderTexture.active = tempTarget;	// 需要将渲染结果记录在这张临时rt上面
					// 调用 立即渲染 指令
					{
						// 省略部分... 只展示参数传递
						
						// 这是这一块上利用这个通道绘制出的强度信息
						// 这是与上一次绘制进行计算之后的结果
						// 在shader中就是依据这个texture来获取这个通道的强度信息
						copyTerrainLayerMaterial.SetTexture("_MainTex", destinationRenderTexture);

						// 这是上一次画刷绘制的结果
						copyTerrainLayerMaterial.SetTexture("_OldAlphaMapTexture", sourceRenderTexture);

						// 地形的 alphamap, 记录所有通道的权重信息
						// 在之后地形渲染中会读取这个 map 上的信息来对地形贴图进行blend操作
						copyTerrainLayerMaterial.SetTexture("_OriginalTargetAplhaMap", targetAlphamapTexture);

						// G
						copyTerrainLayerMaterial.SetTexture(
					}
				}
			});
		}

4. 每帧更新地形数据

ScriptableRenderContext_CUSTOM_Internal_Cull_Injected(...) 函数作为Cull入口
CullScriptable()
	-> CullResults.terrainCullData = terrrainManager->CullAllTerrrains(cullingParameters)
	{
		// 省略...
		// 遍历所有活动的Terrain
		for (TerrainList::const_iterator i = m_ActiveTerrains.begin(); i != m_ActiveTerrains.end(); ++i) {
			// ...
			// 根据透视模式，遍历地形四叉树，计算每个子节点的可视情况
			// 即如果该子节点具有足够的lod，那么其下的所有孩子节点都具有可见性
			// 否则继续遍历该子节点下的节点
			cameraData->terrain->RenderStep1(...);
		}
		// ...
		for (core::flat_set<TerrainData*>::const_iterator it = terrainDatas.begin(); it != terrainDatas.end(); ++it)
			// 更新SplatMaterial信息
			(*it)->GetSplatDatabase().UpdateRegisteredSplatMaterialDatas(updateCache);
			{
				// UpdateRegisteredSplatMaterialDatas 函数
				// 省略部分， TODO...
				bool doUpdate = shaderChanged || materialChanged || updateInputParamsChanged;
				if (doUpdate) {	
					// 一般当新增/删除 Layer 时，会调用该函数
					// 用来更新 SplatMaterial Properties
					user.materialData.Update(material, terrainLayerPtrs, alphaTexturePtrs, terrainSize)
				}
				// 是否需要重新生成 BaseMap 信息
				// 当 PaintTexture 时，会重新生成
				user.materialData.UpdateBaseMaps(material, m_BaseMapResolution, doUpdate || colorSpaceChanged || user.baseMapDirty);
				{
					for (size_t i = 0; !regenerate && i < baseMapCount; ++i)
       						regenerate = regenerate || baseMaps[i].texture == NULL || !baseMaps[i].texture->IsCreated();
					// 如果不需要重新生成就不执行下面的逻辑
					if (!regenerate) return;
					// ...
					
				}
			}
		
	}


设计：
	说明：需要添加额外两张贴图
	1. LayerIndexTexture
	2. LayerWeightTexture
	方法：
		从 Alphamap texture 中获取每个通道(Layer)的权重信息(逐像素获取)，然后对比在这个像素下的权重
		依据权重信息分别记录为 maxChannelWeight, secondChannelWeight, thirdChannelWeight
		同时也可以得到这些权重信息对象 Layer 索引，分别为
		maxChannelIndex, secondChannelIndex, thirdChannelIndex

		然后在 terrain shader 中可以得到这两张贴图，LayerIndexTexture, LayerWeightTexture, 即不需要提供 Alphamap texture 以及 AddPass
		根据 LayerIndexTexture 还原地形贴图索引，通过这个索引信息获取地形贴图的颜色值
		根据 LayerWeightTexture 对每个地形贴图进行混合
		光照模型计算

方案：
	创建贴图
	1. 在 SplatData 中创建两张 Texture，分别记录地形层级的索引信息和权重信息
	2. 为了一致性，将这两张贴图的初始化与 splatmap 创建保持一致，同时也为了保证与splatmap贴图分辨率一致
		注意这两张贴图创建时:
		LayerIndexTexture 需要设置 FilterMode 为 Point, 因为这个贴图是用来保存索引信息的，通过插值的方式获取上面的值反而会导致获取到的信息与原始信息不符
		LayerWeightTexture 则需要设置 FilterMode 为 Bilinear，因为这张贴图用于之后的混合操作，通过插值可以获得较好的混合效果
	
	生成贴图信息
	1. 目前生成地形索引及权重信息的方法是通过 CPU 逐像素计算的，速度十分慢，所以提供了一个按钮用于在绘制完贴图后一键生成这两张贴图的信息
	2. 逐像素遍历，由于 SplatTexture 每个通道上对应的层级都是清楚的，即 R -> 1, G -> 2, B -> 3, A -> 4, 所以只需要根据通道取出当前层级上的权重信息，然后与缓存的最大三层的权重信息进行比较，然后重新计算出最大的三层索引及权重信息，就可以得到这两张贴图的结果。
		注意，这里的缓存信息只是针对每个像素而言的，所以每次切换像素时都需要重置缓存信息。
	
	传递贴图信息到Shader中
	1. 在 SplatMaterialData 中，通过 Update 函数提交贴图信息
	2. 需要在 SplatStaticVars 中声明需要传递的贴图属性信息，然后执行初始化

	地形shader
	1. 默认的地形材质只支持4张纹理贴图，多出4张将会创建新的 Pass 来渲染（这也是这个优化所期望解决的问题）。因此需要在 Tags 里面标 "SplatCount" = "16" 来让引擎为地形创建 16 个 prepass（就是为这些层预先分配了空间，由于debug模式分配新的层级会出现异常，所以这里通过Tag直接将空间分配好，理论上可以让引擎自动为这些层级分配自己的空间）。然后将Dependency "AddPassShader"移除，表示不会通过添加新的pass来渲染。
	2. 在自定义shader中，首先需要根据传递过来的 LayerIndexTexture，重建地形层级贴图索引（这也是为什么上面需要将这张贴图的 Filter Mode 设置为 Point）。根据索引值来对贴图进行采样，最后再通过采样 LayerWeight 贴图进行最后的混合操作。


不足：
	1. 当前生成贴图的方式是需要点击生成按钮来完成，后面可以考虑在用户保存场景时完成贴图的生成。
	2. 实时编辑。当前编辑后绘制的地形是不可见的，需要编辑完成点击生成后才可见。
	3. 看远处的地形时，会出现 “碎” 的现象，可能是采样时 Lod 引起的，后续可能改成 tex2dLod 进行采样。
