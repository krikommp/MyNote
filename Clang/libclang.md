ParseAST:
调用过程：
ASTUnit::Parse
Act->Execute
clang::ParseAST
{
    // 根据token生成decl
```c++
for (bool AtEOF = P.ParseFirstTopLevelDecl(ADecl, ImportState); !AtEOF; AtEOF = P.ParseTopLevelDecl(ADecl, ImportState)) {
    // If we got a null return and something *was* parsed, ignore it.  This
    // is due to a top-level semicolon, an action override, or a parse error
    // skipping something.
    if (ADecl && !Consumer->HandleTopLevelDecl(ADecl.get()))
        return;
}
```
}

ParseFirstTopLevelDecl


TransformTypedefToUsing() {

}


