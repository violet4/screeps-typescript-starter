import { BuilderRole, RoleType, Roles } from "roles/roles";
import { ErrorMapper } from "utils/ErrorMapper";
// import harvesterRun from "roles/harvester";

type Success = "Success"
const Success: Success = "Success"
type Failure = "Failure"
const Failure: Failure = "Failure"
type ReachedDestination = "ReachedDestination"
const ReachedDestination: ReachedDestination = "ReachedDestination"

declare global {
    // Memory extension samples
    interface Memory {
        uuid: number;
        log: any;
        creepCount: number;
    }

    interface CreepMemory {
        role: RoleType;
        room: string;
        chosenTargetId: Id<Structure>|undefined;
        state: string;
        movementState: MovementState;
    }

    // Syntax for adding proprties to `global` (ex "global.log")
    namespace NodeJS {
        interface Global {
            log: any;
        }
    }
    interface Creep {
        run(): void;
        sayHello(): void;
        visual(s: string): void;
        findNearestSource(): Source|null;
        findNearestEnergy(): Source|StructureContainer|null;
        findNearestSpawn(): StructureSpawn|null;
        tryMoveToTarget(): boolean;
        neededHealAction(): boolean;
        getTarget(): RoomPosition|undefined;
        _constructor: Function;
    }
    interface StructureSpawn {
        run(): void;
    }
}

type RenewingState = "Renewing"
const RenewingState: RenewingState = "Renewing"
type IdleState = "Idle"
const IdleState: IdleState = "Idle"
type HarvestState = "Harvest"
const HarvestState: HarvestState = "Harvest"
type DeliverState = "Deliver"
const DeliverState: DeliverState = "Deliver"
type BuildState = "Build"
const BuildState: BuildState = "Build"
type RepairState = "Repair"
const RepairState: RepairState = "Repair"

type CreepState = IdleState | RenewingState
type HarvesterState = CreepState | HarvestState | DeliverState
type WorkerState = CreepState | BuildState | RepairState

type AtTargetState = "AtTarget"
const AtTargetState: AtTargetState = "AtTarget"
type MovingState = "Moving"
const MovingState: MovingState = "Moving"
type MovementState = IdleState|AtTargetState|MovingState

Creep.prototype._constructor = Creep.prototype.constructor
Creep.prototype.constructor = function(id: Id<Creep>) {
    Creep.prototype._constructor(id);
    this.memory.state = IdleState;
}
Creep.prototype.getTarget = function() {
    if (this.memory.chosenTargetId === undefined) return undefined;
    return Game.getObjectById<Structure>(this.memory.chosenTargetId)?.pos;
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
Creep.prototype.neededHealAction = function() {
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
    if (this.neededHealAction())
        return;
    if (this.memory.role === RoleType.Worker)
        return new WorkerCreep(this.id).run();
    else if (this.memory.role === RoleType.Harvester)
        return new HarvesterCreep(this.id).run();
}

class WorkerCreep extends Creep {
    state!: HarvesterState;
    constructor(id: Id<Creep>) {
        super(id);
    }

    // construct, repair, upgrade
    run(): void {
        // this.memory.chosenTargetId
        // console.log(`${this.name} WorkerCreep`);
    }
    build(target: ConstructionSite): CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH {
        return this.build(target);
    }
}
class HarvesterCreep extends Creep {
    state!: WorkerState;
    constructor(id: Id<Creep>) {
        super(id);
    }
    run(): void {
        this.decideNextState();

        switch (this.memory.state) {
            case HarvestState:
                this.performHarvest();
                break;
            case DeliverState:
                this.performDelivery();
                break;
        }
    }
    private performHarvest(): void {}
    private performDelivery(): void {}
    private decideNextState(): void {
        if (this.memory.state === HarvestState
            && this.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            this.memory.state = DeliverState;
            // Set target delivery destination
        }
        else if (this.memory.state === DeliverState
                 && this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
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

export const loop = ErrorMapper.wrapLoop(() => {

    for (let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];
        creep.run();
        // creep.visual();
        // creep.sayHello();
        const roleCls = Roles[creep.memory.role];
        const role = new roleCls(creep);
        role.run();
        // creep.memory.[role,room,working];
    }
    for (let structureName in Game.structures) {
        let structure = Game.structures[structureName];
    }

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
});
