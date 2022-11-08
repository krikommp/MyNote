1. GridPlayerController
-> PlayerIdleState		// 站立状态，等待被选中

-> PlayerSelectedState		// 被选中状态
// 用来做一些动作初始化

-> PlayerPrepareMoveState	// 准备移动状态
// 计算移动范围，显示移动范围贴图，或者一些其他的动作
// 点击判定，根据点击结果，决定不同的行为

-> PlayerMoveState		// 移动状态
// 让玩家开始移动，播放移动动画
// 等待移动结束，结束后需要进行行动力结算

-> PlayerPrepareAttackState	// 准备攻击状态
// 计算攻击范围，显示攻击范围贴画，一些其他动作。。。
// 点击判定，根据点击结果，决定不同的行为

-> PlayerAttackState		// 攻击状态
// 执行攻击行为，播放角色动画
// 等待攻击结束后进行行动力结算

-> PlayerDiscardState		// 行动力不足状态
// 无法进行控制
