fire, water, Thunder, ice, ori, virus

apply water
    if target has thunder tag
        apply water gameplayeffect
        apply thunder gameplayeffect
        foreach all water block nearby
            apply thunder gameplayeffect
    if target has ice tag
        apply thunder froze gameplayeffect
        foreach all water block nearby
            apply froze gameplayeffect
    if target has ori tag
        remove any ori gameplayeffect
    if target has virus tag
        remove any virus gameplayeffect
    if target has fire tag
        remove fire gameplayeffect
       
apply fire
    if target has water tag
        remove water gameplayeffects
        add evaporation reaction damage to target