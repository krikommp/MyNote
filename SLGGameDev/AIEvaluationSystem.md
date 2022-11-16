1. 伪代码
```C++
class AISkillResult {
public:
	int32 AttackX;
	int32 AttackY;
	
	UGridGameplayAbility_Skill* SkillToUse;
};
class AIResult {
public:
	int32 MoveX;
	int32 MoveY;

	List<AISkillResult*> skillResultList;
};
```

- 评价系统
	`UGridAIEvaluationSystemComponent`
```mermaid
classDiagram
class AIResult {
	+ int32 MoveX
	+ int32 MoveY
	+ List~AISkillResult*~ skillResultList
}

class AISkillResult {
	+ int32 AttackX
	+ int32 AttackY
	+ UGridGameplayAbility_Skill* SkillToUse
}

AIResult *-- AISkillResult

class UGridAbilitySystemComponent {
	+ BeginShowSkillRange(SkillCDO, AbilityLevel, bDisplay = false) void
	+ EndShowSkillRange(SkillCDO) void
}

class UGridGameplayAbility_Skill {
	+ CalculateAIEvaluation() : float
}

class UGridAIEvaluationSystemComponent {
	+ StartToCalcateAIEvaluation() : float
	- GetAllUseSkillPossible() : List~List~UGridGameplayAbility~~
	- CalcateMoveEvaluation(int32 TargetTileIndex) : float
	- TMap~int32, AISkillResult~ CachedAIResultList
}

class UGridUnitCharacter {
	+ UGridAIEvaluationSystemComponent* AIEvaluationComp
	+ UGridAbilitySystemComponent* AbilitySystemComp
	- List~UGridGameplayAbility~ Abilities
}

UGridUnitCharacter *-- UGridAIEvaluationSystemComponent
UGridUnitCharacter *-- UGridAbilitySystemComponent
UGridUnitCharacter *-- UGridGameplayAbility_Skill
UGridAIEvaluationSystemComponent *-- AIResult
```
> Tips
> 一点行动力 = 移动一格 = 造成 5 点伤害 = 1 点属性提升