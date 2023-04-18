// Client
FLiveCodingModule::UpdateModules()
{
	// 获取所有的 Modules 状态，并将 IsLoaded 的 Module 加入到 EnableModules 中
	TArray<FModuleStatus> ModuleStatuses;
	FModuleManager::Get().QueryModules(ModuleStatuses);
	TArray<FString> EnableModules;
	for (const FModuleStatus& ModuleStatus : ModuleStatuses) {
		if (ModuleStatus.bIsLoaded) {
			// ....
			EnableModules.Add(FullFilePath);
		}
	}
	// ...
	// 将 enable 的 Module 发送给 LC_Server
	
	// 省略代码
	// 创建 command proxy(EnableModules), 包含 modules dll 参数
	// 将 command 加入到 m_userCommandQueue 中
	// 发起信号量
}

Thread::ReturnValue ClientUserCommandThread::ThreadFunction(...) {
	// 等待信号量
	// 取出 command，并执行 execute 方法
	{
		lock();		
		command->Execute(m_pipe);
		if (command->ExpectsResponse()) {
			// 根据返回值，执行 register 的 action
			moduleCommandMap.Handle(m_pipe, nullptr);
		}
	}
}

// Server
void LiveCodingServerModule::StartupModule() {
	IModularFeatures::Get().RegisterModularFeature(...);
}

void FLiveCodingServer::Start() {
	// ...
	// 创建 Server Thread 和 Compile Thread
	CommandThread = new ServerCommandThread(...);
	{
		// In Server Thread...
		// 等待 Client 连接
		// 当 Client 连接后，创建 CommandThread
		{
			// In Command Thread...
			// 注册 actions
			// 等待 Clinet 数据，执行对应的 action
				
		}
	}
}
