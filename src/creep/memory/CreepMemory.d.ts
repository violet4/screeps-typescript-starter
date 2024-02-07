import { MovementState, RoleType } from '../Creeper';

declare global {
    interface CreepMemory {
        role: RoleType;
        chosenTargetId:
            Id<Structure>
            | Id<Source>
            | Id<ConstructionSite<BuildableStructureConstant>>
            | `pos:${number},${number},${string}`
            | ""
            | undefined;
        state: string;
        movementState: MovementState | "";
    }
}
