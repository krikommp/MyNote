1. Plugin::GenerateAssetData(AssetImportContext& context)
	// 生成dll资源信息
	// 会读取dll类型
	if (CanLoadManagedDllType(dllType)) {
		// 判断 dll 类型，如果是托管dll...

	}
	// 生成一些基本信息，用于在 Inspector 中显示

2. SetCurrentDirectoryW()
	// 设置当前项目路径，作为dll查找的路径
	
	Application::InitializaProject() --- Line 834
	SetCocoaCurrentDirectory(core::string path)

Other:
	1. 当添加一个新的 dll 时，会触发
	PluginManager::RefreshPlugins -> AddPluginPath
	会将 dll 的名字和地址保存到 PluginManager 中的 m_Plugins 成员变量中
	
	2. DllImport 调用过程
	InitializeMonoFromMain
		// 注册  mono_set_find_plugin_callback(((gconstpointer)FindAndLoadUnityPluginMonoWrapper)
		// 将会在 lookup_pinvoke_call_impl -> legacy_lookup_native_library  -> legacy_probe_for_module 函数中被调用
		// 将返回保存的 plugin 地址

	legacy_probe_for_module
		

List:
	GetCompatibleWithPlatform
	GetPlatformDataByGroupAndTargetName
	IsNotEmpty
