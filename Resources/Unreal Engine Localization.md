# Unreal Engine Localization
## 虚幻引擎中的本地化
本章简单介绍了虚幻引擎本地化使用与解析 
## 本地化资源目录结构
本地化管道处理本地化目标，本地化目标有两个部分组成：配置（位于 `"Config/Localization/"`）以及数据（位于 `"Content/Localization"`）
### 引擎
引擎本地化资源路径: `"Engine/Content/Localization"`  
该目录下会为每个 `Target` 创建不同的目录，以 英文 与 中文 为例，其下的目录结构为
```
{TargetName}/
    {TargetName}.manifest
    {TargetName}.locmeta
    en/
        {
            {TargetName}.archive
            {TargetName}.po
            {TargetName}.locres
        }
    zh-Hans/
        {
            {TargetName}.archive
            {TargetName}.po
            {TargetName}.locres
        }
```
不同文件类型作用如下：
| 文件名                | 说明                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| {TargetName}.manifest | 一种json格式文件，用于保存从源代码或资源中收集到的待本地化文本                                           |
| {TargetName}.archive  | 一种json格式文件，用于保存每个文本对应的本地化翻译，不需要手动编辑                                       |
| {TargetName}.po       | 可以被其他翻译软件读取的翻译文件，由引擎将本地化数据导出，经由翻译软件完成本地化之后，再重新导入游戏存档 |
| {TargetName}.locres   | 二进制文件，用于运行期读取每个文化的翻译，由文本本地化编译后才产生的文件                                 |
| {TargetName}.locmeta  | 二进制文件，保存每个文本的源数据（原生语言）                                                             |


## 本地化菜单使用
### 打开本地化界面  
![image-1](../images/Unreal%20Engine%20Localization/1-1%20Open%20Localization%20Dashboard.png)  
如上图所示，点击 `unreal editor menu` - > `Tools` -> `Localization Dashboard` 按钮即可打开本地化编辑界面

### 本地化界面说明  
 ![image-2](../images/Unreal%20Engine%20Localization/1-2%20Localization%20left%20Plane.png)  
   `Targets` 是本地化目标，一个项目可以有一个或多个本地化目标，并且编辑器的本地化目标不会与游戏一同发布。

![image-3](../images/Unreal%20Engine%20Localization/1-3%20localization%20Right%20Plane.png)  
该条目可以用来设置本地化需要读取的文本路径，可以是`项目源码文件`,`虚幻资源文件`，`MetaData`, 设置完成之后可以从这些路径下的文件中收集所有的`FText`。
   > 对于非 C++ 项目，`Gather from Text Files` 不是必要的。

![image-4](../images/Unreal%20Engine%20Localization/1-4%20Localization%20Cultures.png)  
点击 `Add New Culture` 可以添加新的文化，会在项目的`Content/Localization`目录中添加该文化的文件夹保存翻译信息。  
`Gather Text` 按钮可以用来搜索所有的`FText`信息，会将该信息写入到`Content/Localization/TargetName.manifest`中。他会开启一个`UnrealEditor-cmd.exe`的进程，并通过传递参数的方式调用新进程的`UGatherTextFromXXXCommandlet`系列方法进行本地化数据收集工作。  
`Compile Text` 会执行本地化编译工作，将翻译后的本地化数据编译成二进制文件，方便运行时读取数据。
具体代码调用如下：  
   ```C++
    // 调用Gather Text进程 
    TSharedPtr<FLocalizationCommandletProcess> FLocalizationCommandletProcess::Execute(const FString& ConfigFilePath, const bool UseProjectFile)
    {
        // 省略部分，主要是创建管道，方便读取进程的输出信息
        const FString ProjectFilePath = FString::Printf(TEXT("\"%s\""), *FPaths::ConvertRelativePathToFull(FPaths::GetProjectFilePath()));
        const FString ProcessArguments = CommandletHelpers::BuildCommandletProcessArguments(TEXT("GatherText"), UseProjectFile ? *ProjectFilePath : nullptr, *CommandletArguments);
        const FString ProcessPath = FUnrealEdMisc::Get().GetExecutableForCommandlets();
        FProcHandle CommandletProcessHandle = FPlatformProcess::CreateProc(*ProcessPath, *ProcessArguments, true, true, true, nullptr, 0, nullptr, WritePipe);
        // 省略部分，主要是进程创建失败后的处理
        return MakeShareable(new FLocalizationCommandletProcess(ReadPipe, WritePipe, CommandletProcessHandle, ProcessArguments));
    }

    // Gather Text 进程调用的函数，以 收集代码中的本地化数据为例
    int32 UGatherTextFromSourceCommandlet::Main( const FString& Params ) {
        // 省略，主要是根据指定目录收集项目中的FText信息，并将其写入到 manifest 文件中
    }
   ```
进程传递参数：`.\UnrealEditor.exe "YourGameProjectPath.uproject" -run=GatherText -config="Config/Localization/Game_Gather.ini"` 
 > 因此可以使用 UAT 工具辅助完成自动化本地化。UAT 提供了 Localiza脚本，该脚本提供了一种方法来运行本地化管道的各个部分。  
调用命令如下：
`Localize-UEProjectDirectory="YourProject"-UEProjectName="YourProject"-LocalizationProjectNames="TargetName"`  
Unreal 提供了两个本地化提供方，分别是 `OneSky`, `XLOC` ,可以通过本地化提供方获取文本翻译结果。
   
![image-5](../images/Unreal%20Engine%20Localization/1-5%20Edit%20Localization.png)    
点击文化的 `Edit` 可以对收集到的本地化信息进行编辑。Unreal官方并不推荐使用内置的本地化翻译编辑器，可以使用 `Export translations for this culture` 按钮导出 `.po` 文件，使用 [Poedit](https://poedit.net/), [OneSky](https://www.oneskyapp.com/), [XLOC](http://www.xloc.com/) 等一般性工具完成翻译工作，并通过 `Import translations for this culture` 按钮进行 `.po` 文件导入。


## 代码中的文本本地化  
在虚幻引擎中，使用 `FText` 专用字符串完成本地化操作，当需要文本使用本地化时需要使用该类型。  
`FText` 内部使用了 `TSharedRef` 缓存本地化编译后数据信息，因此彼此间复制比较代价比较低廉。并且提供了 `FTextSnapshot` 来帮助检测缓存的 Text 值是否发生改变。
### 文本文字值
可本地化文件通常由三个组件构建：一个**命名空间**；一个**密钥**(形成其标识)；和一个**一个源字符串**(这是被翻译内容的基础，并可以依据它对过时的翻译进行验证)。
#### 在C++中创建文本文字值
可以使用 `LOCTEXT` 系列宏完成创建  

| 宏        | 说明                                                                                      |
| --------- | ----------------------------------------------------------------------------------------- |
| NSLOCTEXT | 需要传递命名空间，密钥和源字符串来创建本地化文本片段                                      |
| LOTEXT    | 需要传递传递密钥和源字符串来创建本地化文本片段，并使用 `LOCTEXT_NAMESPACE` 定义的命名空间 |

举例：
```C++
#define LOCTEXT_NAMESPACE "MyDemoNameSpace"

const TestName = NSLOCTEXT("MyOtherNameSpace", "HelloWorld", "Hello World!");
const OtherName = LOCTEXT("HI", "HI");

#undef LOCTEXT_NAMESPACE
```

在 ini 文件中可以使用 NSLOCTEXT 进行本地化
举例：
```ini
[/Script/IntroTutorials.EditorTutorialSettings]
+Categories=(Identifier="Basics",Title=NSLOCTEXT("TutorialCategories","BasicsTitle","Basics"),Description=NSLOCTEXT("TutorialCategories","BasicsDescription","Getting started with Unreal Engine."),Icon="PlayWorld.RepeatLastPlay",Texture=None,SortOrder=100)
```

在资源中使用 FText 可以自动生成密钥，也可以自定义命名空间和密钥。

#### 文本格式化
可以使用 `FText::Format` 系列函数完成文本格式化操作。 

#### 参数修饰符
不同语言在复数，性别，后置词等方面都有着不同的区别  
FText 可以通过给定一系列参数修饰符来对参数被添加到格式化字符串之前进行一些预处理操作。用户可以通过 `ITextFormatArgumentModifier` 来添加自定义的参数修饰符。  

### 文本生成
可以根据国际化数据生成不依赖于直接本地化的正确文件。  
支持三种文本生成类型：数值型，时间型，变换型。

#### 数值型
根据当地文化，将数值显示为便于人类阅读的文件表示形式。
| 函数                  | 说明                                       |
| --------------------- | ------------------------------------------ |
| FText::AsNumber       | 将任意数值转换为用户友好型                 |
| FText::AsPercent      | 将浮点数转换为百分比                       |
| FText::AsMemory       | 将以字节为单位的值转换为用户友好的内存形式 |
| FText::AsCurrencyBase | 将基数表示的货币转化为本地货币的表型形式   |

#### 时间型
根据当地的文化，将时间的表示形式显示为便于阅读的表示形式。（针对于 `FDateTime`）
| 函数              | 说明                               |
| ----------------- | ---------------------------------- |
| FText::AsDate     | 转化为用户友好的日期表现形式       |
| FText::AsTime     | 转换为用户友好的时间表现形式       |
| FText::AsDateTime | 转化为用户友好的日期和时间表现形式 |
| FText::AsTimespan | 转化为用户友好的时间增量表现形式   |

#### 变换型
将文本转化为大写或小写的表现形式
| 函数           | 说明       |
| -------------- | ---------- |
| FText::ToLower | 转化为小写 |
| FText::ToUpper | 转化为大写 |


### 字符串表
可以将文本资源集中到一个已知位置，方便对重复的本地化文本进行管理


## 总结
虚幻引擎提供了较为完善的本地化方案，可以方便的对代码或资源文件中需要本地化的文件进行管理。  
同时考虑到不同文化间数值类型，语言词性等方面对本地化文本的格式化提供了大量的预处理方法，遵守这些规范可以很方便的对项目文本进行本地化。  
由于这些收集，编译本地化文本都是独立进程的，所以也可以很轻松的借助 UAT 脚本来对项目本地化进行自动化操作。

## Reference
https://docs.unrealengine.com/4.27/zh-CN/ProductionPipelines/Localization/