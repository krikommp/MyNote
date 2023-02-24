1. 找到导出 C++ 文件 头文件，宏等配置信息的方法
2. 找到如何添加工程到 sln 中，让 C# 可以显示出来


UBt 程序入口
	-> private static int Main(string[] ArgumentsArray) 
		// UnrealBuildTool.cs --- line 444

根据 Mode 的类型执行不同的构建逻辑

// Build
// Build Project
-Target=MyProjectEditor Win64 Development -Project="D:\SandBox\MyProject\MyProject.uproject"
-Target=ShaderCompileWorker Win64 Development -Quiet
-WaitMutex
-FromMsBuild

// Build Engine
-Target=UnrealEditor Win64 Development
-Target=ShaderCompileWorker Win64 Development -Quiet
-WaitMutex
-FromMsBuild


// generater project files
-projectfiles -project=D:/SandBox/projectv-ue/ProjectV.uproject -game -engine -progress

关于 UAT 的编译
执行 BuildUAT.bat 会执行 UAT 的编译

关于UBT的编译
运行 GenerateProjectFiles.bat 会进行 UBT 的编译

关于 UHT 编译
1. 每次编译项目前都会对 UnrealBuildTool 这个项目进行编译
	注意：只有当项目需要进行 UnrealBuildTool
分析时才会进行编译，否则将会单纯编译项目
2. 等待 UnrealBuildTool 项目编译完成后会调用 

UnrealBuildTool
1. 编译过程
	1. 编译 Build.cs
	BuildMode::Execute
	BuildMode::Build
	BuildMode::CreateMakefile
	if Mainfile != null then
	var Target = UEBuildTarget::Create
	[
		RulesAssembly::CreateProjectRulesAssembly	// 编译项目 RuleAssembly
		UEBuildTarget::ValidateSharedEnvironment	// 
		UEBuildTarget::PreBuildSetup			// 执行 build.cs
		[
			// ...
			RulesAssembly::CreateModuleRules	// 执行 Construct
			// ...
		]	
	]
	Target.Build()
	[
		// 设置编译环境变量
		// 收集编译文件
		if (Makefile.UObjectModule.Count > 0)
		{
			// 确认是否需要执行 UHT
			// 如果需要那么开启进程执行，并等待进程结束
			ExternalExecution.ExecuteHeaderToolIfNecessary(BuildConfiguration, ProjectFile, Makefile, TargetName, WorkingSet);
		}
		// 省略部分
		TargetReceipt Receipt = PrepareReceipt(TargetToolChain, BuildProducts, RuntimeDependencies);
		// 序列化 Receipt ， 将会在 UAT 中获取这个类型，并将列如 RuntimeDependencies 复制到打包的项目目录
		// ....
		return Makefile
	]
	// 对 Makefile 进行一系列设置
	Makefile.Save(...)
	else 
	if (Makefile.UObjectModules.Count > 0) {
		ExternalExecution.ExecuteHeaderToolIfNecessary(BuildConfiguration, TargetDescriptor.ProjectFile, Makefile, TargetDescriptor.Name, WorkingSet);
	}
	end
	return Makefile
	
	

		

UnrealHeaderTool
1. 通过进程调用 UHT
步骤：
	1. BuildMode::CreateMakefile() -- Line 782
	2. ExternalExecute::HeaderToolIfNecessary()	---	Line 1250
		1. 强制重新生成头文件
		2. 遍历所有的 UObjectModules 	---	AreGeneratoedCodeFilesOutOfDate()	---	line 1120
			每个模块都会存一个 Intermediate/Build/Win64/UnrealEditor/Inc/ModuleName/Timestamp 文件，记录头文件修改时间
			遍历每个模块下的头文件
				获取这个文件的最后写入时间，将这个文件与 Timestamp 文件进行比较，如果发现该头文件比较新，那么就准备进行 UnrealHeaderTool 分析程序
		3. 尝试编译 UHT
			会再进行一次编译流程，但是不会检测是否需要编译 UHT

		4. 拼接需要传递给  UHT 的命令
				
		5. ExternalExecute::RunExternalNativeExecutable()	---	Line 1055
			开启进程并等待 UHT 完成头文件分析
		6. UpdateTimestamps
			更新文件时间，并将模块头文件路径写入 		---	Line 1297
	

UHT进程调用参数： 
项目调用参数
F:\UnrealEngine\Engine\Binaries\Win64\UnrealHeaderTool.exe "D:\SandBox\projectv-ue\ProjectV.uproject" "D:\SandBox\projectv-ue\Intermediate\Build\Win64\ProjectVEditor\Development\ProjectVEditor.uhtmanifest" -LogCmds="loginit warning, logexit warning, logdatabase error" -Unattended -WarningsAsErrors -abslog="F:\UnrealEngine\Engine\Programs\UnrealBuildTool\Log_UHT.txt"

引擎调用参数
UnrealEditor "F:\UnrealEngine\Engine\Intermediate\Build\Win64\UnrealEditor\Development\UnrealEditor.uhtmanifest" -LogCmds="loginit warning, logexit warning, logdatabase error" -Unattended -WarningsAsErrors -abslog="F:\UnrealEngine\Engine\Programs\UnrealBuildTool\Log_UHT.txt"

Programs参数
LiveCodingConsole "F:\UnrealEngine\Engine\Intermediate\Build\Win64\LiveCodingConsole\Development\LiveCodingConsole.uhtmanifest" -LogCmds="loginit warning, logexit warning, logdatabase error" -Unattended -WarningsAsErrors -abslog="F:\UnrealEngine\Engine\Programs\UnrealBuildTool\Log_UHT.txt"

$(LocalDebuggerCommandArguments)

2. 编译文件

Target -> BuildBinaries[...]
BuildBinary -> BuildModules[...]
BuildModule -> CppFiles[...]

// 获取module编译目录
ModuleRule::GetAllModuleDirectories()

步骤：
	CreateMakefile
	1. 会尝试从本地加载 Makefile.bin 文件，如果不存在则会开始生成
	路径：MyProject/Intermediate/Build/Win64/MyProject/Development/Makefile.bin
	2. 生成
		UEBuildTarget::Create		// Create Target
		首先会生成 RulesAssembly	---	Line 705
		步骤：
		1. 获取引擎目录下所有的 Plugins 目录
		2. 会将 Engine 目录下的 Runtime, Developer, Editor,
ThirdParty, 以及所有 Plugins 中的 xxx.build.cs 文件收集到列表中
		3. 然后拼接出 dll 名字： F:\UnrealEngine\Engine\Intermediate\Build\BuildRules\UE5Rules.dll
		4. 这个名字会作为下面编译/查找 dll 的路径
		5. 是否需要重新编译，如果不需要直接取出 dll，如果需要那么执行
cs 编译器进行编译
		6. 编译出的就是 RulesAssembly
RulesCompiler::CreateEngineRulesAssemblyInternal()


Running F:/UnrealEngine/Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.exe  -projectfiles -project="D:/SandBox/projectv-ue/ProjectV.uproject" -game -engine -progress -log="D:\SandBox\projectv-ue/Saved/Logs/UnrealVersionSelector-2022.07.14-10.15.19.log"
Arg = -projectfiles
Arg = -project=D:/SandBox/projectv-ue/ProjectV.uproject
Arg = -game
Arg = -engine
Arg = -progress
Arg = -log=D:\SandBox\projectv-ue/Saved/Logs/UnrealVersionSelector-2022.07.14-10.15.19.log
Get Mode Name = GenerateProjectFilesMode
Log file: D:\SandBox\projectv-ue\Saved\Logs\UnrealVersionSelector-2022.07.14-10.15.19.log
Log file: F:\UnrealEngine\Engine\Programs\UnrealBuildTool\Log_GPF.txt

Some Platforms were skipped due to invalid SDK setup: Mac, IOS, Android, Linux, LinuxArm64, TVOS.
See the log file for detailed information

Discovering modules, targets and source code for project...
Binding IntelliSense data...
Binding IntelliSense data... 100%
Writing project files...


0>Arg = -Target=ProjectVEditor Win64 Development -Project="D:\SandBox\projectv-ue\ProjectV.uproject"
0>Arg = -Target=ShaderCompileWorker Win64 Development -Quiet
0>Arg = -WaitMutex
0>Arg = -FromMsBuild

-projectfiles -project=D:/SandBox/projectv-ue/ProjectV.uproject -game -engine -progress -log=D:\SandBox\projectv-ue/Saved/Logs/UnrealVersionSelector-2022.07.14-10.15.19.log

-Target=ProjectVEditor Win64 Development -Project="D:\SandBox\projectv-ue\ProjectV.uproject" -Target=ShaderCompileWorker Win64 Development -Quiet -WaitMutex -FromMsBuild



//////////////////////////
OnBlackjackSharpRuleCreate 入口

GetScriptPlugins

-Target=UnrealEditor Win64 Development -Target=ShaderCompileWorker Win64 Development -Quiet -WaitMutex -FromMsBuild

-Target="UnrealEditor Win64 Debug" -Target="ShaderCompileWorker Win64 Development -Quiet" -WaitMutex -FromMsBuild



//////////////////////////
打包

写入：F:\UEProjects\BjFpsDemo\Intermediate\Build\Win64\BjFpsDemo\Development\TargetMetadata.dat

读取：CopyBuildToStagingDirectory.Automation.cs
BuildCookRun.Automation::DoBuildCookRun()
{
	// ...
	ProjectBuildToStagingDirectory(...)
	// ...
}

CopyBuildToStagingDirectory::CopyBuildToStagingDirectory()
{
	CreateStagingManifest(...)
}
CopyBuildToStagingDirectory::CreateStagingManifest() {
	// Read the receipt for this target
	TargetReceipt Receipt;
	if (!TargetReceipt.TryRead(ReceiptFileName, out Receipt))
	{
		throw new AutomationException("Missing or invalid target receipt ({0})", ReceiptFileName);
	}
}

//////////////////////////////////////////////
C++ 编译
编译参数：
-Target=BjRPGGameEditor Win64 Development -Project="D:\SandBox\BjRPGGame\BjRPGGame.uproject" -Target=ShaderCompileWorker Win64 Development -Quiet -WaitMutex -FromMsBuild

UEBuildTarget::Build() 

// 遍历所有dll，执行编译
using (GlobalTracer.Instance.BuildSpan("UEBuildBinary.Build()").StartActive())
			{
				foreach (UEBuildBinary Binary in BuildBinaries)
				{
					List<FileItem> BinaryOutputItems = Binary.Build(Rules, TargetToolChain, GlobalCompileEnvironment, GlobalLinkEnvironment, TargetDescriptor.SpecificFilesToCompile, WorkingSet, ExeDir, Makefile);
					Makefile.OutputItems.AddRange(BinaryOutputItems);
				}
			}

// 获取 dll 中的 Module，执行 Module 编译
		foreach (UEBuildModule Module in Modules)
			{
				List<FileItem> LinkInputFiles;
				if (Module.Binary == null || Module.Binary == this)
				{
					// Compile each module.
					Log.TraceVerbose("Compile module: " + Module.Name);
					LinkInputFiles = Module.Compile(Target, ToolChain, BinaryCompileEnvironment, SpecificFilesToCompile, WorkingSet, Graph);

					// Save the module outputs. In monolithic builds, this is just the object files.
					if (Target.LinkType == TargetLinkType.Monolithic)
					{
						Graph.SetOutputItemsForModule(Module.Name, LinkInputFiles.ToArray());
					}

		//.....................
		}



// 设置编译参数
UEBuildModuleCPP::Compile
CppCompileEnvironment ModuleCompileEnvironment = CreateModuleCompileEnvironment(Target, BinaryCompileEnvironment);
[[O



// 使用ClangDatabase
-mode=GenerateClangDatabase -project="D:\SandBox\BjRPGGame\BjRPGGame.uproject" Development Win64 -Target=BjRPGGameEditor
-projectfiles 


Running F:\UnrealEngine\Engine\Binaries\DotNET\UnrealBuildTool\UnrealBuildTool.exe -Target="BjRPGGameEditor Win64 Development -Project=""D:/SandBox/BjRPGGame/BjRPGGame.uproject""" -LiveCoding -LiveCodingModules="F:/UnrealEngine/Engine/Intermediate/LiveCodingModules.txt" -LiveCodingManifest="F:/UnrealEngine/Engine/Intermediate/LiveCoding.json" -WaitMutex -LiveCodingLimit=100
  Log file: F:\UnrealEngine\Engine\Programs\UnrealBuildTool\Log.txt
  Using 'git status' to determine working set for adaptive non-unity build (F:\UnrealEngine).
  Target is up to date
  Total execution time: 3.63 seconds


// 确认需要生成 Makefile, 主要是判断项目目录是否发生变化，文件是否发生新增或删除
TargetMakefile.IsValidForSourceFiles(Makefile, TargetDescriptor.ProjectFile, TargetDescriptor.Platform, WorkingSet, out Reason)



// 生成 Makefile 内容
UEBuild UEBuildModuleCPP::Compile 

// 生成项目

VCProject::WriteProjectFile // 为每个项目生成 csproj

VCProjectFileGenerator::WritePrimaryProjectFile // 写入 sln


BjRPGGame Win64 Development -Project=D:\SandBox\BjRPGGame\BjRPGGame.uproject  D:\SandBox\BjRPGGame\BjRPGGame.uproject -NoUBTMakefiles  -remoteini="D:\SandBox\BjRPGGame" -skipdeploy -Manifest=F:\UnrealEngine\Engine\Intermediate\Build\Manifest.xml -NoHotReload -log="F:\UnrealEngine\Engine\Programs\AutomationTool\Saved\Logs\UBT-BjRPGGame-Win64-Development.txt"



public ModuleRules CreateModuleRules(string ModuleName, ReadOnlyTargetRules Target, string ReferenceChain)

UE5.1
UnrealBuildTool
1. BuildMode
	1. 编译项目
		-Target="MyProject_UE5_1Editor Win64 Development -Project=\"D:\SandBox\MyProject_UE5_1\MyProject_UE5_1.uproject\"" -Target="ShaderCompileWorker Win64 Development -Quiet" -WaitMutex -FromMsBuild
	2. 编译引擎
		-Target="UnrealEditor Win64 Development" -Target="ShaderCompileWorker Win64 Development -Quiet" -WaitMutex -FromMsBuild
		
-Target="UnrealEditor Win64 Development" -Target="ShaderCompileWorker Win64 Development -Quiet" -WaitMutex -FromMsBuild -NoUBTMakefiles