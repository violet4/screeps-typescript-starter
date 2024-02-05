import { MovementState, RoleType } from '../Creeper';

declare global {
    interface CreepMemory {
        role: RoleType;
        chosenTargetId: Id<Structure> | Id<Source> | Id<ConstructionSite<BuildableStructureConstant>> | "" | undefined;
        state: string;
        movementState: MovementState | "";
    }
}
