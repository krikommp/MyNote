IL2CPP:
	原本的 IL2CPP 不支持 System.Reflection.Assembly.Load 函数，会直接返回异常

	更改：
		加入了 il2cpp::vm::MetadataCache::LoadAssemblyFromBytes 函数，支持Assembly创建，再注册到全局 Assemblies 列表。


F:\UnrealEngine\Engine\Binaries\DotNET\UnrealBuildTool\UnrealBuildTool.exe UnrealPak Win64 Development -Project=F:\UEProjects\BjFpsDemo\BjFpsDemo.uproject  F:\UEProjects\BjFpsDemo\BjFpsDemo.uproject -NoUBTMakefiles  -Manifest=F:\UnrealEngine\Engine\Intermediate\Build\Manifest.xml -NoHotReload -log="F:\UnrealEngine\Engine\Programs\AutomationTool\Saved\Logs\UBT-UnrealPak-Win64-Development.txt"



F:\UnrealEngine\Engine\Binaries\DotNET\UnrealBuildTool\UnrealBuildTool.exe BjFpsDemo Win64 Development -Project=F:\UEProjects\BjFpsDemo\BjFpsDemo.uproject  F:\UEProjects\BjFpsDemo\BjFpsDemo.uproject -NoUBTMakefiles  -remoteini="F:\UEProjects\BjFpsDemo" -skipdeploy -Manifest=F:\UnrealEngine\Engine\Intermediate\Build\Manifest.xml -NoHotReload -log="F:\UnrealEngine\Engine\Programs\AutomationTool\Saved\Logs\UBT-BjFpsDemo-Win64-Development.txt"


Running UnrealHeaderTool "F:\UEProjects\BjFpsDemo\BjFpsDemo.uproject" "F:\UEProjects\BjFpsDemo\Intermediate\Build\Win64\BjFpsDemo\Development\BjFpsDemo.uhtmanifest" -LogCmds="loginit warning, logexit warning, logdatabase error" -Unattended -WarningsAsErrors -abslog="F:\UnrealEngine\Engine\Programs\AutomationTool\Saved\Logs\UHT-BjFpsDemo-Win64-Development.txt"