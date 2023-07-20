需要使用 Vistual Studio 命令行工具

```powershell
# 创建签名
sn -k key_name.snk

# 为该签名生成公钥
sn -p key_name.snk key_name_public.snk

# 使用签名编译 csharp 代码
csc /t:library /keyfile:key_name.snk /out:csharp_library.dll csharp_scripts.cs

# 编译
csc /r:csharp_library.dll csharp_scripts.cs

# 验证签名是否发生修改
# 如果发生修改输出：Failed to verify assembly -- Strong name validation failed.
# 否则输出：Assembly 'csharp_library.dll' is valid
sn -vf csharp_library.dll
```