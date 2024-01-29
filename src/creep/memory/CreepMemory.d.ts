import { MovementState, RoleType } from '../Creep';

declare global {
    interface CreepMemory {
        role: RoleType;
        room: string;
        chosenTargetId: Id<Structure> | undefined;
        state: string;
        movementState: MovementState;
    }
}
