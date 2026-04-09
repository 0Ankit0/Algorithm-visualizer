# Explanation Rubric

All algorithm traces in this repository must satisfy this rubric for every step explanation.

## Rubric (required in every step)

1. **Plain language, one concept per step**
   - Keep each step focused on one operation.
   - Use short sentences and concrete terms.
2. **Explain why an operation happened**
   - State what decision or comparison triggered the operation.
3. **Avoid unexplained jargon**
   - If a technical term appears, include enough context for a beginner to follow.
4. **Include invariant and stopping condition**
   - Invariant: what remains true before and after the step.
   - Stopping condition: when the algorithm can stop.
5. **Include final interpretation, not just final state**
   - Explain what the current state means for the final answer.

## Standard explanation template

Every step explanation must include these labeled sections:

- `Concept:`
- `Why:`
- `Invariant:`
- `Stopping condition:`
- `Final interpretation:`

## Repository enforcement

- Existing algorithms are normalized through shared step builders so current traces already emit rubric-compliant explanations.
- `VisualizationStep` validates/normalizes explanations so serialized and runtime steps remain rubric-compliant.
- Automated tests assert that:
  - every study-mode algorithm emits rubric-compliant explanations;
  - every supported algorithm in custom visualization emits rubric-compliant explanations.

A pull request that introduces a new algorithm or new step explanations must keep these checks passing before merge.
