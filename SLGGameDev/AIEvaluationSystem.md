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
	- CalcateMoveEvaluation(int32 TargetTileIndex, int32& ActionPoint) : float
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
> CalcateMoveEvaluation：
> 	(1.0 -normalize(MoveCost)) + CalcateDistanceBetweenTargets()
> CalcateDistanceBetweenTargets:
		if self.health > value then
		flag = move to targets
		else then
		flag = away from targets
		end if
		distance weight coefficient = 0.0f;
		foreach all targets in gridmap
			distance = gridmap -> DistanceInTilesBetweenIndexes(targetIndex, target.tileIndex)
			if flag is move to targets 
				distance weight coefficient +=  1.0 - normalize(distance) * (target cause damage coefficient)
			if flag us away from targets 
				distance weight coefficient += normalize(distance)
		return distance weight coefficient
		