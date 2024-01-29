import { MovementState, RoleType } from '../Creeper';

declare global {
    interface CreepMemory {
        role: RoleType;
        chosenTargetId: Id<Structure> | Id<Source> | "" | undefined;
        state: string;
        movementState: MovementState | "";
    }
}
