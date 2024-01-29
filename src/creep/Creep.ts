
export enum RoleType {
    Harvester = "Harvester",
    Worker = "Worker"
}
export type RenewingState = "Renewing"
export const RenewingState: RenewingState = "Renewing"
export type IdleState = "Idle"
export const IdleState: IdleState = "Idle"
export type HarvestState = "Harvest"
export const HarvestState: HarvestState = "Harvest"
export type DeliverState = "Deliver"
export const DeliverState: DeliverState = "Deliver"
export type BuildState = "Build"
export const BuildState: BuildState = "Build"
export type RepairState = "Repair"
export const RepairState: RepairState = "Repair"

export type CreepState = IdleState | RenewingState
export type HarvesterState = CreepState | HarvestState | DeliverState
export type WorkerState = CreepState | BuildState | RepairState

export type AtTargetState = "AtTarget"
export const AtTargetState: AtTargetState = "AtTarget"
export type MovingState = "Moving"
export const MovingState: MovingState = "Moving"
export type MovementState = IdleState|AtTargetState|MovingState

class WorkerCreep extends Creep {
    state!: HarvesterState;
    constructor(id: Id<Creep>) {super(id);}
    run(): void {}
}
class HarvesterCreep extends Creep {
    state!: WorkerState;
    constructor(id: Id<Creep>) {super(id);}
    run(): void {
        this.decideNextState();

        const creepMemory: CreepMemory = this.memory;
        switch (this.memory.state) {
            case HarvestState:
                this.performHarvest();
                break;
            case DeliverState:
                this.performDelivery();
                break;
        }
    }
    performHarvest(): void {}
    performDelivery(): void {}
    decideNextState(): void {
        if (this.memory.state === HarvestState) {
            if (this.energyIsFull())
                this.memory.state = DeliverState;
            // Set target delivery destination
        }
        else if (this.memory.state === DeliverState && this.energyIsEmpty()) {
            // destination full?
            this.memory.state = HarvestState;
            // Set target harvest source
        }
        // Add other state transitions as needed
    }
}



Creep.prototype.visual = function(s: string="") {
    if (s==="")
        s = `${this.name}${this.memory.role}`;
    this.room.visual.text(
        s,
        this.pos.x-1.5,
        this.pos.y-1,
        {
            align: 'left',
            opacity: 0.8,
            // backgroundColor: '#A3E4D7',
            color:'black',
        });
}

// Property 'getTarget' does not exist on type 'Creep'.ts(2339)
Creep.prototype.getTarget = function() {
    if (this.memory.chosenTargetId === undefined) return undefined;
    return Game.getObjectById<Structure>(this.memory.chosenTargetId)?.pos;
}



Creep.prototype._constructor = Creep.prototype.constructor
Creep.prototype.constructor = function(id: Id<Creep>) {
    Creep.prototype._constructor(id);
    this.memory.state = IdleState;
}
Creep.prototype.findNearestSource = function() {
    if (!this.body.some(bodyPart => bodyPart.type==WORK))
        return null;  // can't harvest source

    //TODO make this work 1+ rooms away?..
    return this.pos.findClosestByPath(FIND_SOURCES, {filter: src => src.energy>0});
}
Creep.prototype.findNearestSpawn = function() {
    return this.pos.findClosestByPath(FIND_MY_SPAWNS, {filter: (spawn) => spawn.isActive()});
}
Creep.prototype.findNearestEnergy = function() {
    //TODO make this work 1+ rooms away?..
    const container = this.pos.findClosestByPath<StructureContainer>(
        FIND_STRUCTURES, {filter: struct => (struct.structureType==STRUCTURE_CONTAINER
                                             && struct.store.energy > 0)}
    );
    if (container !== null) return container;
    return this.findNearestSource();
}
Creep.prototype.tryMoveToTarget = function() {
    if (!this.memory.chosenTargetId) return false;
    const target = this.getTarget();
    if (target===undefined) {
        //TODO..?
        this.memory.chosenTargetId = undefined;
        return false;
    }
    if (this.moveTo(target.x, target.y)===OK) {
        if(this.pos.inRangeTo(target, 1)) {
            this.memory.movementState = AtTargetState;
        }
        return true;
    }
    else return false;
}
Creep.prototype.neededRenewAction = function() {
    //TODO don't forcibly renew. something else may be more important.
    if ((this.ticksToLive??101)<100 && this.memory.state !== RenewingState) {
        this.memory.state = RenewingState;
        this.memory.movementState = MovingState;
        this.memory.chosenTargetId = this.findNearestSpawn()?.id;
    }
    if (this.memory.state === RenewingState) {
        if (this.memory.movementState === MovingState) {
            return this.tryMoveToTarget();
        }
        else if (this.memory.movementState === AtTargetState) {
            //TODO handle errors
            this.findNearestSpawn()?.renewCreep(this);
            // finished healing
            if (this?.ticksToLive??1001 >= 1000) {
                this.memory.state = IdleState;
                this.memory.movementState = IdleState;
                this.memory.chosenTargetId = undefined;
            }
            return true;
        }

    }
    return false;
}

Creep.prototype.run = function() {
    this.decideNextState();

    const creepMemory: CreepMemory = this.memory;
    switch (this.memory.state) {
        case HarvestState:
            this.performHarvest();
            break;
        case DeliverState:
            this.performDelivery();
            break;
    }


    if (this.neededRenewAction())
        return;
    if (this.memory.role === RoleType.Worker)
        return new WorkerCreep(this.id).run();
    else if (this.memory.role === RoleType.Harvester)
        return new HarvesterCreep(this.id).run();
}
Creep.prototype.decideNextState = function() {
    return;
}
Creep.prototype.energyIsFull = function(): boolean {
    return this.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
}
Creep.prototype.energyIsEmpty = function(): boolean {
    return this.store.getUsedCapacity(RESOURCE_ENERGY) === 0;
}

