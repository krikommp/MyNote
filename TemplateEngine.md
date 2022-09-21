# CSharpTemplateEngine

## 作用
为了简化在 CSharp 代码中手写 C++ 到 CSharp 的 wrap 文件过程，避免大量代码冗余  
实现一个 CSharp 模板引擎

用户只需要提供自定义的模板文件，以及补充必要的信息，就可以生成最终符合用户要求的文件


## 使用方法

1. 首先需要针对文件中所使用到的变量，命名空间，程序集来进行添加  
    <u>使用例：</u>
   ```C#
    var global = new TemplateEngine.Globals();
    // 添加模板需要的全局变量
    global.Context.Add("type", type);
    // 添加模板需要的程序集
    global.Assemblies.Add(typeof(Program).Assembly);
    global.Assemblies.Add(typeof(Regex).Assembly);
    // 添加模板需要的命名空间
    global.Namespaces.Add("System.Linq");
    global.Namespaces.Add("System.Text.RegularExpressions");
   ```

2. 语法   
   目前支持三种标记符
   1. 以 "<%" 开始, "%>" 结束。  
    标记为代码块，这个区域中需要填写 csharp 代码，模板引擎会当作普通的 csharp 代码来执行  
    <u>使用例：</u>：
    ```c#
    // 表示循环语句, 会根据代码结果执行多次
    <%foreach (var baseType in ConsoleApp1.Program.GetBasesRecursive(type)){%>
    // do something
    <%}%>
    ``` 
   2. 以 "<%=" 开始, "%>" 结束。  
    标记为表达式块，这个区域中需要填写具有返回值的 csharp 表达式。  
    <u>使用例：</u>
    ```C#
    // 会根据表达式将结果计算出来
    public interface <%="I" + type.Name + ": " + (type.BaseTypes.Select(t => $"I{t.ToString()}").Aggregate((cur, next) => $"{cur}, {next}"))%>
    // 上式结果为： public interface IUClass: IUStruct
    ```
   3. 没有任何标记的区域
    没有任何标记的区域默认当作文字块来处理，在模板引擎中会这些文字（包括空格，换行等）格式原封不动的渲染到最后的结果文件中。

3. 完整的例子  
   模板文件：
   ```C#
   #pragma warning disable CS0109
    using System;
    using System.Runtime.CompilerServices;

    namespace UnrealEngine
    {
        public interface <%="I" + type.Name + ": " + (type.BaseTypes.Select(t => $"I{t.ToString()}").Aggregate((cur, next) => $"{cur}, {next}"))%>
        {
            unsafe <%=type.Name%>Unsafe* Get<%=type.Name%>Ptr();
        }

        public unsafe struct <%=type.Name%>Unsafe : I<%=type.Name%>
        {
            public const int bufferSize = <%=type.SizeOf%>;

    #pragma warning disable CS0649
            public fixed byte fixedBuffer[bufferSize];
    #pragma warning restore CS0649

            public <%=type.Name%>Unsafe* Get<%=type.Name%>Ptr(){
                fixed (byte* ptr = fixedBuffer) 
                {
                    return (<%=type.Name%>Unsafe*)ptr;
                }
            }
            <%foreach (var baseType in ConsoleApp1.Program.GetBasesRecursive(type)){%>
            public <%=baseType.Type.GetDisplayName()%>Unsafe* Get<%=baseType.Type.GetDisplayName()%>Ptr()
            {
                fixed(byte* ptr = fixedBuffer) {
                    return (<%=baseType.Type.GetDisplayName()%>Unsafe*)Ptr;
                }
            }
            <%}%>
        }
        <%if(Regex.IsMatch(type.Name, "^U[A-Z]")){%> <%var baseClass = type.BaseTypes.FirstOrDefault(); var isRoot = baseClass == null; var supers = new List<string>(); if(!isRoot) { supers.Add(baseClass.Type.GetDisplayName()); } supers.Add($"I{type.Name}");%> 
        public partial class <%=isRoot? ($"{type.Name}{supers.Aggregate(" : IDisposable", (cur, next) => $"{cur}, {next}")}") : ($"{type.Name}{(supers.Count == 0 ? "" : $" : {supers.Aggregate((cur, next) => $"{cur}, {next}")}")}") %>
        {
            public unsafe <%=type.Name%>Unsafe* Get<%=type.Name%>Ptr() 
            {
                return (<%=type.Name%>Unsafe*)nativePtr;
            }
            <%if(isRoot){%>
            protected unsafe void* nativePtr;
            public unsafe void Dispose()
            {
                UObjectMethods.Release((UObjectUnsafe*)nativePtr);
            }
            unsafe ~<%=type.Name%>
            {
                Dispose();
            }
            <%}%>
        }
        <%}%>
    }
   ```
   最终渲染结果：
   ```c#
   #pragma warning disable CS0109
    using System;
    using System.Runtime.CompilerServices;

    namespace UnrealEngine
    {
            public interface IUClass: IUStruct
            {
                    unsafe UClassUnsafe* GetUClassPtr();
            }

            public unsafe struct UClassUnsafe : IUClass
            {
                    public const int bufferSize = 648;

    #pragma warning disable CS0649
                    public fixed byte fixedBuffer[bufferSize];
    #pragma warning restore CS0649

                    public UClassUnsafe* GetUClassPtr(){
                            fixed (byte* ptr = fixedBuffer)
                            {
                                    return (UClassUnsafe*)ptr;
                            }
                    }

                    public UStructUnsafe* GetUStructPtr()
                    {
                        fixed(byte* ptr = fixedBuffer) {
                            return (UStructUnsafe*)Ptr;
                        }
                    }

                    public UFieldUnsafe* GetUFieldPtr()
                    {
                        fixed(byte* ptr = fixedBuffer) {
                            return (UFieldUnsafe*)Ptr;
                        }
                    }

                    public UObjectUnsafe* GetUObjectPtr()
                    {
                        fixed(byte* ptr = fixedBuffer) {
                            return (UObjectUnsafe*)Ptr;
                        }
                    }

                    public UObjectBaseUtilityUnsafe* GetUObjectBaseUtilityPtr()
                    {
                        fixed(byte* ptr = fixedBuffer) {
                            return (UObjectBaseUtilityUnsafe*)Ptr;
                        }
                    }

                    public UObjectBaseUnsafe* GetUObjectBasePtr()
                    {
                        fixed(byte* ptr = fixedBuffer) {
                            return (UObjectBaseUnsafe*)Ptr;
                        }
                    }

            }

            public partial class UClass : UStruct, IUClass
            {
                public unsafe UClassUnsafe* GetUClassPtr()
                {
                    return (UClassUnsafe*)nativePtr;
                }

            }

    }

   ```