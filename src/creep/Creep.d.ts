interface Creep {
    run(): void;
    sayHello(): void;
    visual(s: string): void;
    findNearestSource(): Source | null;
    findNearestEnergy(): Source | StructureContainer | null;
    findNearestSpawn(): StructureSpawn | null;
    tryMoveToTarget(): boolean;
    neededRenewAction(): boolean;
    getTarget(): RoomPosition | undefined;
    _constructor: Function;
    energyIsFull(): boolean;
    energyIsEmpty(): boolean;
    memory: CreepMemory;
    decideNextState(): void;
}
