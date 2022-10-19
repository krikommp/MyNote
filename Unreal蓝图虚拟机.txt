1. 虚拟机的字节码为 EExprToken 枚举
	位于 Script.h 文件中

2. 字节码中每个指令都由对应的 C++ 函数实现
	所以想要加入新的字节码指令，就需要提供对应的函数实现

3. FFrame类就是蓝图虚拟机，可以将他理解为一个栈帧，每一次对UFunction的调用都会创建一个栈帧

4. FFrame类
	UObject* Object		函数执行对象
	unit8* Code 		函数编译后的字节码数组

	主要方法：
	Step():	从字节码 Code 中取出一个字节码并执行相应的函数
	以及一些从 Code 中读取数据的辅助方法
	
	void FFrame::Step(UObject* Context, RESULT_DECL)
	{
		int32 B = *Code++;
		(GNatives[B])(Context,*this,RESULT_PARAM);
	}
	
	ProcessEvent 函数，创建一个 FFrame 作为调用栈

UPackage::Save 
UPackage::Save2

显示蓝图字节码
CompileDisplaysBinaryBackend=true

// 在执行保存之前，需要进行 Harvest 操作
...
// 以 ExecuteUbergraph_BP_CodePawn 为例（UFunction*）
UFunction::Serialize -> UStruct::Serialize
尝试序列化表达式 -> 当前的 Archive 为 FPackageHarvester -> 判断该 UObject
是否属于当前包 -> 对于 C++ 中的 Native Function 都为 Import 
-> 收集 Import 信息
如果有 Outer 也需要加入到 Import 中，所以再执行一次
FPackageHarvester::Serialize
-> 递归直到所有类型信息收集完毕

class Test{
int a;
uobject* b; (-1)
}
// 


// 再执行写入操作
FArchive = FLinkerSave

InnerSave					// 保存package
ESavePackageResult::SaveHarvestedRealms	// 保存 SaveContext 中的成员到 uasset 中
[
// Imports
BuildLinker()
[
// 根据 import map 和 export map 中的 uobject 对象
// 分别创建 import index (负值，递减)，export index(正值，递增)
// 结果保存在 ObjectIndicesMap 中
// Build Linker Reverse Mapping
{
	for (int32 ExportIndex = 0; ExportIndex < Linker->ExportMap.Num(); ++ExportIndex)
	{
		UObject* Object = Linker->ExportMap[ExportIndex].Object;
		check(Object);
		Linker->ObjectIndicesMap.Add(Object, FPackageIndex::FromExport(ExportIndex));
	}
	for (int32 ImportIndex = 0; ImportIndex < Linker->ImportMap.Num(); ++ImportIndex)
	{
		UObject* Object = Linker->ImportMap[ImportIndex].XObject;
		check(Object);
		Linker->ObjectIndicesMap.Add(Object, FPackageIndex::FromImport(ImportIndex));
	}
}
]

// exports 
WriteExports()
[
// 写出 Export Object 
// 对于蓝图对象，一般在 ubergraph 这个 UFunction 中会保存一份蓝图字节码
// 执行到此处，将会进入 UFunction::Serialize -> UStruct::Serialize
// 在每个 ustruct 中都会一个 Script 的成员变量即字节码
// 当需要保存时，会执行 SerializeExpr 流程
// 其中会将 UObject*, UFunction* 等序列化成 PackageIndex
// 即 ObjectIndicesMap 中的结果
]

// Write Header
WritePackageHeader()
[
// 写入package信息
// Save Dummy Import Map, overwritten later.
	{
		SCOPED_SAVETIMER(UPackage_Save_WriteDummyImportMap);
		Linker->Summary.ImportOffset = Linker->Tell();
		for (FObjectImport& Import : Linker->ImportMap)
		{
			StructuredArchiveRoot.GetUnderlyingArchive() << Import;
		}
	}

]
// 保存 PackageName, OuterIndex, ClassName, ObjectName 信息
]


// 读取
FArchive = FLinkerLoad

FAsyncPackage::LoadImports_Event()


解析表达式：
... -> UFunction::Serialize -> UStruct::Serialize -> 
if is loading -> ScriptLoadHelper.LoadStructWithScript ->
UStruct::SerializeExpr

FLinkerLoad::operator<<(UObject*&)
[
// 读取 PackageIndex
// 根据索引 获取 Import Map 中的对象值
]

BlackboardData'/Game/AI/BB_LearnTree.BB_LearnTree'
Class'/Script/CodeGenerator.CodePawn'


fix:

1. editor 模式下查找 package name 找不到
GetPackageLinker -> FPackageName::DoesPackageExist ----> false

2. runtime 模式下 import map 中的 XObject 没有加载成功
	ResetBlackjackSharp 	// 注册package和对应类型
	FAsyncPackage::Event_StartImportPackages	// 加载 import
packages
	[
		FObjectImport* Import = FindExistingImport(LocalImportIndex);
		//
如果FindExistingImport失败，会将package插入到AsyncLoadingThread中
	]
	


首先执行 CreatePackage
之后才会执行 FSharpGeneratedClassBuilder


///////////////////// Variables

TArray<struct FBPVariableDescription> NewVariables：这个蓝图自己创建的变量，不包含从父类继承的，在编译时会添加到BlueprintGeneratedClass中。
# 调用过程
umg 被触发 -> 
FBlueprintEditor::OnAddNewVariable() -> 
FBlueprintEditorUtiles::AddMemberVariable(UBlueprint* Blueprint, const FName& NewVarName, const FEdGraphPinType& NewVarType, const FString& DefaultValue/* = FString()*/) ->
[
1. 创建一个 FBPVariableDescription NewVar;
2. 赋值，设置flag，guid等
3. 添加进 NewVariables 数组中
4. 子类验证
5. 重编译 skeleton class, 通知其他观察者，dirty
	[
		FastGenerateSkeletonClass()->
		CreateClassVariablesFromBlueprint()->
		[
			遍历 Blueprint->NewVariables
			创建 FProperty, 会将创建的 FProperty LinkAdd 到 NewClass 中
			UStruct 中有 ChilProperties 链表，NewProperty 会加入自身到链表中
		]
	]
]


# 析构
UStruct::~UStruct()
{
	// 将链接的 FProperty 析构
	DestroyPropertyLinkedList(childProperties);
}

/////////////////////// 构建问题
测试命令行参数：
D:\SandBox\MyProject\MyProject.uproject -run=Cook  -TargetPlatform=Windows -fileopenlog -ddc=DerivedDataBackendGraph -unversioned -abslog=E:\UnrealEngine\Engine\Programs\AutomationTool\Saved\Cook-2022.09.26-14.12.48.txt -stdout -CrashForUAT -unattended -NoLogTimes  -UTF8Output




////////////////////// Link
https://zhuanlan.zhihu.com/p/69067129
https://blog.csdn.net/mohuak/article/details/83027211
