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

## 与本地化有关的 c++ 类
### FText
NSLOCTEXT(InNamespace, InKey, InTextLiteral) -- 手动指定 NameSpace
依赖
	-> const TCHAR*
	-> FInternationlization::ForUseOnlyByLocMacroAndGraphNodeTextLiterals_CreateText


LOCTEXT(InKey, InTextLiteral) -- 使用上文定义的 LOCTEXT_NAMESPACE 作为Key
依赖
	-> const TCHAR*
	-> FInternationlization::ForUseOnlyByLocMacroAndGraphNodeTextLiterals_CreateText

FInternationlization::BackupCultureState(FCultureStateSnapshot& OutSnapshot) -- 备份当前的本地化状态
依赖
	-> FCultureStateSnapshot

FInternationlization::RestoreCultureState(const FCultureStateSnapshot& InSnapshot) -- 恢复本地化状态
依赖
	-> FCultureStateSnapshot

FInternationalization::SetCurrentCulture(const FString& InCultureName) -- 设置当前的本地化语言
依赖
	-> FCulturePtr 一个智能指针类，指向 FCulture 类，表示一个区域设置，包含了该区域设置的语言、地区、货币等信息

FStringTableRegistry -- 字符串表
LOCTABLE_NEW() -- FStringTableRegistry::Get().Internal_NewLocTable 创建一个字符串表
依赖
	-> FName
	-> FString
LOCTABLE_SETSTRING() -- FStringTableRegistry::Get().Internal_SetLocTableEntry 在字符串表中加入一个字符
依赖
	-> FName
	-> FString

LOCTABLE(ID, KEY) -- FStringTableRegistry::Get().Internal_FindLocTableEntry(TEXT(ID), TEXT(KEY), EStringTableLoadingPolicy::FindOrLoad) 从字符串表中根据 Namespace 和 Key 查找本地化字符串

INVTEXT(InTextLiteral) -- FText::AsCultureInvariant(TEXT(InTextLiteral)) 创建一个不受限与本地化配置的 FText
依赖
	-> ETextFlag::Type

{
	LOCGEN_NUMBER() -- FText::AsNumber
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString

	LOCGEN_NUMBER_GROUPED()	-- FText::AsNumber
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString
	LOCGEN_NUMBER_UNGROUPED() -- FText::AsNumber
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString

	LOCGEN_NUMBER_CUSTOM() -- FText::AsNumber
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString
}

{
	LOCGEN_PERCENT() -- FText::AsPercent -- AsPercentTemplate
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString

	LOCGEN_PERCENT_GROUPED() -- FText::AsPercent -- AsPercentTemplate
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString

	LOCGEN_PERCENT_UNGROUPED() -- FText::AsPercent -- AsPercentTemplate
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString

	LOCGEN_PERCENT_CUSTOM() -- FText::AsPercent -- AsPercentTemplate
	依赖
		-> FCulturePtr
		-> FInternationalization
		-> UE4LocGen_Private::GetCultureImpl
		-> FNumberFormattingOptions
		-> FastDecimalFormat::IntegralToString
}

LOCGEN_CURRENCY() -- FText::AsCurrencyBase
依赖
	-> FCulturePtr
	-> FInternationalization
	-> UE4LocGen_Private::GetCultureImpl
	-> FNumberFormattingOptions
	-> FastDecimalFormat::IntegralToString

LOCGEN_DATE_UTC() -- FText::AsDate
依赖
	-> FDateTime::FromUnixTimestamp(int64)
	-> EDateTimeStyle::Type
	-> FCulturePtr
	-> FTextChronoFormatter

LOCGEN_DATE_LOCAL() -- FText::AsDate
依赖
	-> FDateTime::FromUnixTimestamp
	-> EDateTimeStyle::Type
	-> FText::GetInvariantTimeZone
	-> UE4LocGen_Private::GetCultureImpl


LOCGEN_TIME_UTC() -- FText::AsTime
依赖
	-> FDateTime::FromUnixTimestamp
	-> EDateTimeStyle::Type
	-> FCulturePtr
	-> FTextChronoFormatter

LOCGEN_TIME_LOCAL() -- FText::AsTime
依赖
	-> FDateTime::FromUnixTimestamp
	-> EDateTimeStyle::Type
	-> FText::GetInvariantTimeZone
	-> UE4LocGen_Private::GetCultureImpl

FText::AsDateTime
FDateTime::FromUnixTimestamp
UE4LocGen_Private::GetCultureImpl
FTextChronoFormatter::AsDateTime
FText::ToUpper()
FText::ToLower()
FInternationalization::RestoreCultureState

```powershell
FInternationalization  -- 0
FInternationalization::FCultureStateSnapshot -- 0
FCulturePtr -- 0
UE4LocGen_Private::GetCultureImpl -- 1
FNumberFormattingOptions -- 1
FastDecimalFormat -- 1
FDateTime::FromUnixTimestamp -- 1
EDateTimeStyle::Type -- 1
FTextChronoFormatter -- 1
ETextFlag::Type -- 0
FTextFormat -- 0
ETextIdenticalModeFlags -- 0
FText::FormatNamed -- 1
FLocTextHelper -- 2
```

### `CommandLet`:
在 `FEngineLoop:PreInitPostStartupScreen` 函数中被初始化
通过传入参数 `-run=${CommandLetName}` 来指定需要执行的命令行类名称
然后通过命令类的名字，在 `TransientPackage` 中找到这个类
所有的 `CommandLet` 都继承与 `UCommandLet` 他是一个 `UObject`

对于 `GatherText` 会从 `Config/Localization/Game_Gather.ini` 配置文件中得到  `CommandletClassName` 类名，得到 `UGatherTextCommandletBase` 的特定子类
例如 `CommandletClass=GatherTextFromAssetsCommandlet`，则将执行`UGatherTextFromAssetsCommandlet` 的入口函数

```powershell
// 
UCommandlet
UGatherTextCommandletBase
UGatherTextFromAssetsCommandlet
FModuleManager
FAssetRegistryModule
FAssetData
FCollectionManagerModule
ICollectionManager
```




"D:/SandBox/MyProject10/MyProject10.uproject" -run=GatherText -config="Config/Localization/Game_Gather.ini"
$(LocalDebuggerCommandArguments)