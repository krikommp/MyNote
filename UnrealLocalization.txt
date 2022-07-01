C++ 中使用 “NSLOCTEXT” 或
“LOCTEXT”，本地化收集程序将负责采集文本

使用方式
1. 打开
	点击 Unreal Editor 的菜单界面 -> Tools -> Localization Dashboard
	可以打开本地化界面
2. 

记录
在 Loadlization Dashboard 界面中点击 Gather Text 会执行收集本地化文字流程

会开启一个 UnrealEditor-cmd.exe 进程，这也是一个 Unreal
进程但是不会执行图形界面
命令行参数：
"F:/UEProjects/BjFpsDemo/BjFpsDemo.uproject" -run=GatherText -config="Config/Localization/Game_Gather.ini"

进入 GatherTextFromSourceCommandlet.cpp 中对源代码文件进行分析

将分析结果，键值对保存在 .manifest 文件中


编译
命令行参数："F:/UEProjects/BjFpsDemo/BjFpsDemo.uproject" -run=GatherText -config="Config/Localization/Game_Compile.ini"
启动本地化文字编译

// Temp
"F:/UEProjects/BjFpsDemo/BjFpsDemo.uproject" -run=GatherText -config="Config/Localization/Game_Gather.ini"
F:\UnrealEngine\Engine\Binaries\Win64\UnrealEditor-Cmd.exe
