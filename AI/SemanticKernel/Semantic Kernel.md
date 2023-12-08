# 介绍
Semantic Kernel是一个SDK，它将OpenAI，Azure OpenAI和Hugging Face等大型语言模型（LLM）与C#，Python和Java等传统编程语言集成在一起。语义内核通过允许您定义可以在几行代码中链接在一起的插件来实现这一点。
然而，语义内核的特别之处在于它能够自动编排带有AI的插件。使用语义内核规划器，您可以要求LLM生成实现用户独特目标的计划。之后，语义内核将为用户执行计划。

# 入门 （以 c# 为例）

## 使用输入参数运行 Prompts
通过预定义一个 prompts 创建一个语义函数，作为多个操作的初始输入
```c#
// 定义了一个总结语句的函数

var prompt = @"{{$input}}One line TLDR with the fewest words.";    
var summarize = kernel.CreateSemanticFunction(prompt);  
string text1 = @"  
1st Law of Thermodynamics - Energy cannot be created or destroyed.  
2nd Law of Thermodynamics - For a spontaneous process, the entropy of the universe increases.  
3rd Law of Thermodynamics - A perfect crystal at zero Kelvin has zero entropy."; 
string text2 = @"  
1. An object at rest remains at rest, and an object in motion remains in motion at constant speed and in a straight line unless acted on by an unbalanced force.  
2. The acceleration of an object depends on the mass of the object and the amount of force applied.  
3. Whenever one object exerts a force on another object, the second object exerts an equal and opposite on the first.";  

// 将语句作为参数传入，调用语义函数
Console.WriteLine(await summarize.InvokeAsync(text1));  
Console.WriteLine(await summarize.InvokeAsync(text2));

// prompt 连接
// 将两个语义函数按顺序依次执行，并得到最终结果
string translationPrompt = @"{{$input}}Translate the text to math.";  
string summarizePrompt = @"{{$input}}Give me a TLDR with the fewest words as math format.";  
var translator = kernel.CreateSemanticFunction(translationPrompt);  
var summarize = kernel.CreateSemanticFunction(summarizePrompt);  
string inputText = @"  
1st Law of Thermodynamics - Energy cannot be created or destroyed.  
2nd Law of Thermodynamics - For a spontaneous process, the entropy of the universe increases.  
3rd Law of Thermodynamics - A perfect crystal at zero Kelvin has zero entropy.";  
  
// Run two prompts in sequence (prompt chaining)  
var output = await kernel.RunAsync(inputText, translator, summarize);    
Console.WriteLine(output);
```
上面是通过代码中定义语义函数，也可以单独在文本中定义语义函数
```directory
Plugins 
│ 
└─── OrchestratorPlugin 
	| 
	└─── GetIntent 
		| 
		└─── config.json 
		└─── skprompt.txt
```

其中 `skprompt.txt` 文件将包含会被发送给 AI 服务的请求
例如
```txt
Bot: How can I help you? 
User: {{$input}} 

--------------------------------------------- 

The intent of the user in 5 words or less:
```
通过自然语言定义了一个获取用户意图的函数，其中 `{{$input}}` 将作为函数的参数，将会在 `config.json` 中定义。
`config.json` 中需要定义语义函数的详细配置
- `type` -- AI 服务类型
- `description` -- 函数的作用，`planner` 将会根据该属性自动编排执行函数的计划
- `completion` -- 模型的配置信息，包括 `max_tokens` 和 `temperature`
- `input` -- 定义函数的参数
例如
```json
{
     "schema": 1,
     "type": "completion",
     "description": "Gets the intent of the user.",
     "completion": {
          "max_tokens": 500,
          "temperature": 0.0,
          "top_p": 0.0,
          "presence_penalty": 0.0,
          "frequency_penalty": 0.0
     },
     "input": {
          "parameters": [
               {
                    "name": "input",
                    "description": "The user's request.",
                    "defaultValue": ""
               }
          ]
     }
}
```
完成定义后可以通过 `ImportSemanticSkillFromDirectory` 函数来向 `kernel` 注册语义函数
```c#
var pluginsDirectory = Path.Combine(System.IO.Directory.GetCurrentDirectory(), "path", "to", "your", "plugins", "folder");

// Import the OrchestratorPlugin from the plugins directory.
var orchestratorPlugin = kernel
     .ImportSemanticSkillFromDirectory(pluginsDirectory, "OrchestratorPlugin");

// Get the GetIntent function from the OrchestratorPlugin and run it
var result = await orchestratorPlugin["GetIntent"]
     .InvokeAsync("I want to send an email to the marketing team celebrating their recent milestone.");

Console.WriteLine(result);
```
上面的代码尽管可以工作成功，但是无法很好的与 `native` 代码配合，一种可行的方式是让 AI 服务输出可供选择的选项，然后在 `native` 代码中通过 `switch` 来执行分支选项。
```json
{  
  "schema": 1,  
  "type": "completion",  
  "description": "Gets the intent of the user.",  
  "completion": {  
    "max_tokens": 500,  
    "temperature": 0.0,  
    "top_p": 0.0,  
    "presence_penalty": 0.0,  
    "frequency_penalty": 0.0  
  },  
  "input": {  
    "parameters": [  
      {        "name": "input",  
        "description": "The user's request.",  
        "defaultValue": ""  
      },  
      {        "name": "history",  
        "description": "The history of the conversation.",  
        "defaultValue": ""  
      },  
      {        "name": "options",  
        "description": "The options to choose from.",  
        "defaultValue": ""  
      }  
    ]  }}
```
在 `config.json` 中添加了两个新的参数
- `history` -- 用于获取历史输入信息 （可能是其他函数生成的，也可能是历史记录）
- `options` -- 用于约束语义函数的输出
```txt
{{$history}}  
User: {{$input}}  
  
---------------------------------------------  
  
Provide the intent of the user. The intent should be one of the following: {{$options}}  
  
INTENT:
```
同时，也可以在语义函数中调用另一个语义函数：
```txt
{{SummarizeSkill.Summarize $history}}
User: {{$input}}

---------------------------------------------

Provide the intent of the user. The intent should be one of the following: {{$options}}

INTENT:
```
需要注意的是，被调用的语义函数也需要预先被注册：
```c#
var pluginsDirectory = Path.Combine(System.IO.Directory.GetCurrentDirectory(), "path", "to", "your", "plugins", "folder");

// Import the OrchestratorPlugin and SummarizeSkill from the plugins directory.
var orchestrationPlugin = kernel.ImportSemanticSkillFromDirectory(pluginsDirectory, "OrchestratorPlugin");
var summarizationPlugin = kernel.ImportSemanticSkillFromDirectory(pluginsDirectory, "SummarizeSkill");

// Create a new context and set the input, history, and options variables.
var context = kernel.CreateNewContext();
context["input"] = "Yes";
context["history"] = @"Bot: How can I help you?
User: My team just hit a major milestone and I would like to send them a message to congratulate them.
Bot:Would you like to send an email?";
context["options"] = "SendEmail, ReadEmail, SendMeeting, RsvpToMeeting, SendChat";

// Run the Summarize function with the context.
var result = await orchestrationPlugin["GetIntent"].InvokeAsync(context);

Console.WriteLine(result);
```
## 定义 `native` 函数
在上文中创建了一个语义函数，当程序需要根据语义函数的输出来执行对应的实际程序代码时就需要向 `kernel` 注册一个 `native` 函数。
### 确认文件的位置
一般来说可以将文件放置到同名的插件目录
例如
```directory
Plugins
│
└─── OrchestratorPlugin
|    │
|    └─── GetIntent
|         └─── skprompt.txt
|         └─── config.json
|         └─── OrchestratorPlugin.cs
|
└─── MathPlugin
     │
     └─── MathPlugin.cs
```
### 定义 `native` 函数
#### 定义单个输入参数的函数
```c#
using Microsoft.SemanticKernel.SkillDefinition;
using Microsoft.SemanticKernel.Orchestration;

namespace Plugins;

public class MathPlugin
{
    [SKFunction, Description("Takes the square root of a number")]
    public string Sqrt(string number)
    {
        return Math.Sqrt(Convert.ToDouble(number)).ToString();
    }
}
```
注意到函数的输入和输出类型都为 `string` 类型，这是因为 `kernel` 通过 `string` 来将各部分输入输出传递
并且函数开头添加了 `Description` 前缀修饰，这是为了让 `planner` 识别该函数的用途
#### 定义具有多个输入参数的函数
有多种方法
1. 使用 `context` 作为函数的参数
```c#
[SKFunction, Description("Adds two numbers together")]
[SKParameter("input", "The first number to add")]
[SKParameter("number2", "The second number to add")]
public string Add(SKContext context)
{
    return (
        Convert.ToDouble(context["input"]) + Convert.ToDouble(context["number2"])
    ).ToString();
}
```
`context` 中将包含上下文中所有变量，在代码中可以通过变量名来获取需要的变量。
注意当使用 `planner` 时将会根据参数的描述来自动为函数提供参数输入。
`context` 中所有对象都为 `string`
2. 分别定义参数
```c#
[SKFunction, Description("Subtract two numbers")]  
public string Subtract([Description("The first number to subtract from")] string input,  
    [Description("The second number to subtract away")]  
    string number2,  
    SKContext context)  
{  
    return (  
        Convert.ToDouble(input) - Convert.ToDouble(number2)  
    ).ToString(CultureInfo.InvariantCulture);  
}
```
同样需要通过 `Description` 修饰参数，且参数类型都为 `string`
可以传递 `context` 用来获取额外的信息
#### 定义函数输出
所有语义和 `native` 函数都将返回一个 `SKContext` 作为函数的调用结果
他将直接作为调用的结果返回或作为下一个管道的输入
1. 单输出结果
如果函数仅需要一个返回结果，那么该返回结果的类型需要为 `string`
这个结果会被保存在 `context` 中的 `input` 里面
2. 多输出结果
将返回值改为 `SKContext` 类型
例如将参数中的 `context` 作为结果返回，可以在函数体中修改 `context` 中的内容
可以使用 `context.Variables.Update()` 函数修改 `input` 的值，这将直接导致下一个流程的 `context` 的输入或函数的结果发生变化
```c#
[SKFunction, Description("Get chat response")]  
public async Task<SKContext> ChatAsync(  
    [Description("The new message")] string message,  
    [Description("Unique and persistent identifier for the user")] string userId,  
    [Description("Name of the user")] string userName,  
    [Description("Unique and persistent identifier for the chat")] string chatId,  
    [Description("Type of the message")] string messageType,  
    [Description("Previously proposed plan that is approved"), DefaultValue(null), SKName("proposedPlan")] string? planJson,  
    [Description("ID of the response message for planner"), DefaultValue(null), SKName("responseMessageId")] string? messageId,  
    SKContext context,  
    CancellationToken cancellationToken = default)  
{
// ...
	return context;
}
```
### 使用 `native` 函数
通过调用 `ImportSkill` 函数来注册函数
调用方式与调用语义函数的方式相同
```c#
using Microsoft.SemanticKernel;
using Plugins;

// ... instantiate your kernel

var mathPlugin = kernel.ImportSkill(new MathPlugin(), "MathPlugin");

// Run the Sqrt function
var result1 = await mathPlugin["Sqrt"].InvokeAsync("64");
Console.WriteLine(result1);

// Run the Add function with multiple inputs
var context = kernel.CreateNewContext();
context["input"] = "3";
context["number2"] = "7";
var result2 = await mathPlugin["Add"].InvokeAsync(context);
Console.WriteLine(result2);
```
### 函数链接
`Senmantic Kernel` 按照 `unix` 管道进行设置，因此可以 `context` 中的 `$input` 对象可以从一个语义函数流转到下一个语义函数
![[1.1.png]]
#### 简化代码
除了直接通过 `InvokeAsync` 逐个调用函数外，也可以通过 `kernel.RunAsync` 方法来自动调用一系列函数
这些函数将共享同一个上下文
```c#
var myOutput = await kernel.RunAsync(
    new ContextVariables("Charlie Brown"),
    myJokeFunction,
    myPoemFunction,
    myMenuFunction);

Console.WriteLine(myOutput);
```
### 规划器
在之前的代码中，我们都是手动编排AI函数来解决问题，这需要开发者充分预测用户的所有输入情况，对于可扩展的AI应用不是一个很好的方案。
`Planner` 用于接受用户的请求，然后回返回如何完成请求的计划。他获取预先注册到内核的函数，重新组合成一系列完成目标的步骤。
因此只需要提供原子函数，`Planner` 会自动根据用户请求创建合适的流程而无需构建显式的流程代码。
也可以创建自己的 `Planner` 以便完成特定的需求。
#### 创建 `Planner`
```C#
// Create planner 
var planner = new SequentialPlanner(kernel);
```
#### 创建和运行 `Planner`
```c#
// Create a plan for the ask 
var ask = "If my investment of 2130.23 dollars increased by 23%, how much would I have after I spent $5 on a latte?"; 
var plan = await planner.CreatePlanAsync(ask); 
// Execute the plan 
var result = await plan.InvokeAsync(); 
Console.WriteLine("Plan results:"); Console.WriteLine(result.Result);
```
#### 原理
`Planner` 本质也是一系列 AI 函数的组合
通过一个 prompt 来规定输出的内容和格式（XML）
根据定义的函数说明来组合成计划。
#### 小提示
由于生成 `plan` 的过程可能过于复杂和浪费
针对一些常见的方案，可以创建一系列预计划，并将其作为 XML 保存到项目中。
也可以备份计划，方便再次执行。
###  提供记忆
有三种方式来为语义提供记忆
- 传统键值对：可以直接在 `context` 中记录每次对话消息或者需要作为记忆的内容
- 本地存储：将上下文信息保留在文本中
- embeddings：将长文本作为数字向量，可以进行语义查询
embeddings 是一种将单词或其他数据表示为高维的一种方法，将单词或其他数据向量化有助于衡量他们之间的相关性和无关性，并支持数学运算。
例如对于超过 10000 页的文本，由于 tokens 的限制无法将整个文本全部放入 AI 服务的上下文中，因此需要将大型文本分解成较小的部分。可以通过将每一页总结为较小的段落，然后为每一个总结生成一个 embedding 来实现。