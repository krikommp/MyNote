1. 构建 Makefile
	`public TargetMakefile Build(BuildConfiguration BuildConfiguration, ISourceFileWorkingSet WorkingSet, TargetDescriptor TargetDescriptor, ILogger Logger, bool bInitOnly = false)`
	其中 Makefile Object 拥有 UObjectModules 记录具有 UObject 类型的 Module
2. 设置 ObjectModule
	`ExternalExecution.SetupUObjectModules(ModulesToGenerateHeadersFor, Rules.Platform, ProjectDescriptor, Makefile.UObjectModules, Makefile.UObjectModuleHeaders, Rules.GeneratedCodeVersion, MetadataCache, Logger);`
	-> ExternalExecution::SetupUObjectModule 
		// 递归收集目录下所有头文件路径
	-> ExternalExecution::SetupUObjectModuleHeader
		// 通过 MetaDataCache 搜索头文件中是否有反射标记
		// 读取文件内容，通过正则判断文件中是否函数 `U(CLASS|STRUCT|ENUM|INTERFACE|DELEGATE)`
	-> 