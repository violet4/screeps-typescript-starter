
export enum RoleType {
    Harvester = "Harvester",
    Worker = "Worker",
    Upgrader = "Upgrader",
}
export type RenewingState = "Renewing"
export const RenewingState: RenewingState = "Renewing"
export type IdleState = "Idle"
export const IdleState: IdleState = "Idle"
export type HarvestState = "Harvest"
export const HarvestState: HarvestState = "Harvest"

export type GetEnergyState = "GetEnergyState"
export const GetEnergyState: GetEnergyState = "GetEnergyState"
export type UpgradeState = "UpgradeState"
export const UpgradeState: UpgradeState = "UpgradeState"

export type DeliverState = "Deliver"
export const DeliverState: DeliverState = "Deliver"
export type BuildState = "Build"
export const BuildState: BuildState = "Build"
export type RepairState = "Repair"
export const RepairState: RepairState = "Repair"

export type BaseCreepState = IdleState | RenewingState
export type HarvesterStates = HarvestState | DeliverState
export type WorkerStates = BuildState | RepairState
export type UpgraderStates = GetEnergyState | UpgradeState

export type CreepState = BaseCreepState | HarvesterStates | WorkerStates | UpgraderStates

export type AtTargetState = "AtTarget"
export const AtTargetState: AtTargetState = "AtTarget"
export type MovingState = "Moving"
export const MovingState: MovingState = "Moving"
export type MovementState = IdleState|AtTargetState|MovingState

export class Creeper {
    creep: Creep;
    constructor(creep: Creep) {
        this.creep = creep;
    }

    static initialize(creep: Creep): Creeper {
        const roleType: RoleType = creep.memory.role as RoleType;
        if (roleType === RoleType.Harvester) {
            return new HarvesterCreep(creep);
        }
        else if (roleType === RoleType.Worker) {
            return new WorkerCreep(creep);
        }
        else if (roleType === RoleType.Upgrader) {
            return new UpgraderCreep(creep);
        }
        return new Creeper(creep);
    }

    public get state(): CreepState {
        return this.creep.memory.state as CreepState;
    }
    public set state(newState: CreepState) {
        this.creep.memory.state = newState;
    }
    public get chosenTargetId() {
        return this.creep.memory.chosenTargetId;
    }
    public set chosenTargetId(targetId: "" | Id<Structure<StructureConstant>> | Id<Source> | undefined) {
        this.creep.memory.chosenTargetId = targetId;
    }

    public isEnergyFull() {
        return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
    }
    public isEnergyEmpty() {
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0;
    }
    public hasEnergy() {
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }
    setEnergyTarget() {
        this.chosenTargetId = this.findNearestEnergy()?.id;
    }

    visual(s: string="") {
        if (s==="")
            s = `${this.creep.name}${this.creep.memory.role}`;
        this.creep.room.visual.text(
            s,
            this.creep.pos.x-1.5,
            this.creep.pos.y-1,
            {
                align: 'left',
                opacity: 0.8,
                // backgroundColor: '#A3E4D7',
                color:'black',
            }
        );
    }

    getTargetPosition() {
        return this.getTarget()?.pos;
    }
    getTarget() {
        if (this.chosenTargetId === undefined) return undefined;
        return Game.getObjectById(this.chosenTargetId as Id<Structure>);
    }

    findNearestNonemptySource(): Source | null {
        if (!this.creep.body.some(bodyPart => bodyPart.type==WORK))
            return null;  // can't harvest source

        //TODO make this work 1+ rooms away?..
        return this.creep.pos.findClosestByPath(FIND_SOURCES, {filter: src => src.energy>0});
    }
    findNearestSpawn() {
        return this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {filter: (spawn) => spawn.isActive()});
    }
    findNearestEnergy() {
        //TODO make this work 1+ rooms away?..
        const container = this.creep.pos.findClosestByPath<StructureContainer>(
            FIND_STRUCTURES, {filter: struct => (struct.structureType==STRUCTURE_CONTAINER
                                                 && struct.store.energy > 0)}
        );
        if (container !== null) return container;
        return this.findNearestNonemptySource();
    }
    tryMoveToTarget() {
        if (!this.chosenTargetId) return false;
        const target = this.getTargetPosition();
        if (target===undefined) {
            //TODO..?
            this.chosenTargetId = undefined;
            return false;
        }
        if (this.creep.moveTo(target.x, target.y)===OK) {
            // if(this.creep.pos.inRangeTo(target, 1)) {
            //     this.creep.memory.movementState = AtTargetState;
            // }
            return true;
        }
        else return false;
    }
    neededRenewAction() {
        //TODO don't forcibly renew. something else may be more important.
        // if ((this.creep.ticksToLive??101)<100 && this.state !== RenewingState) {
        if ((this.creep.ticksToLive??150)<150 && this.state !== RenewingState) {
            this.state = RenewingState;
            this.creep.memory.movementState = MovingState;
            this.chosenTargetId = this.findNearestSpawn()?.id;
        }
        if (this.state === RenewingState) {
            if (this.creep.memory.movementState === MovingState) {
                return this.tryMoveToTarget();
            }
            else if (this.creep.memory.movementState === AtTargetState) {
                //TODO handle errors
                this.findNearestSpawn()?.renewCreep(this.creep);
                // finished healing
                if (this.creep?.ticksToLive??1001 >= 1000) {
                    this.state = IdleState;
                    this.creep.memory.movementState = IdleState;
                    this.chosenTargetId = undefined;
                }
                return true;
            }

        }
        return false;
    }

    /*
        first we run our special run logic, then we return whether or not we
        used up our job for this tick so that following logic can decide whether
        to stop or keep processing.
    */
    runIsDone(): boolean {
        // console.log("Creeper.run")
        return this.neededRenewAction();
        // const state = this.decideNextState();

        // const creepMemory: CreepMemory = this.creep.memory;
        // // switch (state) {
        // //     case HarvestState:
        // //         // this.performHarvest();
        // //         break;
        // //     case DeliverState:
        // //         // this.performDelivery();
        // //         break;
        // // }


        // if (creepMemory.role === RoleType.Worker)
        //     return new WorkerCreep(this.creep).runIsDone();
        // else if (creepMemory.role === RoleType.Harvester)
        //     return new HarvesterCreep(this.creep).runIsDone();
        // return false;
    }
    decideNextState() {
        return;
    }
    energyIsFull(): boolean {
        return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
    }
    energyIsEmpty(): boolean {
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0;
    }

    getRoomController() {
        return Game.rooms[this.creep.room.name].controller;
    }


}

class WorkerCreep extends Creeper {
    constructor(creep: Creep) {super(creep);}
    runIsDone(): boolean {
        // console.log("WorkerCrep.run")
        return true;
    }
}
class UpgraderCreep extends Creeper {
    constructor(creep: Creep) {super(creep);}
    runIsDone(): boolean {
        if (super.runIsDone()) return true;
        this.decideNextState();
        // console.log(`upgrader creep state is ${this.state}`)

        // console.log("UpgraderCreep.run")
        switch (this.state) {
            case GetEnergyState:
                return this.performGetEnergy();
            case UpgradeState:
                return this.performUpgrade();
        }
        return false;
    }
    setUpgradeTarget() {
        this.chosenTargetId = this.getRoomController()?.id;
    }
    decideNextState(): void {
        if (this.state === GetEnergyState) {
            if (this.isEnergyFull()) {
                this.state = UpgradeState;
                this.chosenTargetId = undefined;
            }
        }
        else if (this.state === UpgradeState) {
            if (this.isEnergyEmpty()) {
                this.state = GetEnergyState;
                this.chosenTargetId = undefined;
            }
        }
        else {
            if (this.hasEnergy()) {
                this.state = UpgradeState;
                this.chosenTargetId = undefined;
            }
            else {
                this.state = GetEnergyState;
                this.chosenTargetId = undefined;
            }
        }

        if (!this.chosenTargetId) {
            if (this.state === UpgradeState)
                this.setUpgradeTarget();
            else if (this.state === GetEnergyState)
                this.setEnergyTarget();
        }
    }
    performUpgrade(): boolean {
        const target = this.getTarget();
        if (!target) return false;
        if (this.creep.upgradeController(target as StructureController) === OK)
            return true;
        else if (this.creep.moveTo(target) === OK)
            return true;
        return false;
    }
    performGetEnergy(): boolean {
        const target: Structure<StructureConstant> | null | undefined = this.getTarget();
        if (!target) return false;
        if (this.creep.withdraw(target, RESOURCE_ENERGY) === OK)
            return true;

        const sources = target.pos.lookFor('source');
        if (sources.length>0 && this.creep.harvest(sources[0]) === OK)
            return true;
        else if (this.tryMoveToTarget())
            return true;
        return false;
    }

    // decideNextState(): void {
    //     if (this.state === HarvestState) {
    //         if (this.energyIsFull()) {
    //             this.state = DeliverState;
    //             this.setDeliveryTarget();
    //         }
    //     }
    //     else if (this.state === DeliverState && this.energyIsEmpty()) {
    //         this.state = HarvestState;
    //         this.setHarvestTarget();
    //     }
    //     else {
    //         this.state = HarvestState;
    //         this.setHarvestTarget();
    //     }
    // }
}

class HarvesterCreep extends Creeper {
    // state!: WorkerState;
    constructor(creep: Creep) {super(creep);}
    runIsDone(): boolean {
        if (super.runIsDone())
            return true;
        this.decideNextState();

        switch (this.state) {
            case HarvestState:
                return this.performHarvest();
            case DeliverState:
                return this.performDelivery();
        }
        console.error(`harvester encountered unexpected state ${this.state}`)
        return false;
    }

    performHarvest(): boolean {
        if (!this.chosenTargetId)
            return false;
        const source = Game.getObjectById(this.chosenTargetId as Id<Source>);
        if (!source)
            return false;
        if (this.creep.harvest(source) !== OK) {
            this.tryMoveToTarget();
        }
        return true;
    }
    performDelivery(): boolean {
        const target = this.getTarget();
        if (!target)
            return false;
        if (this.creep.transfer(target, RESOURCE_ENERGY) === OK)
            return true
        else
            return this.tryMoveToTarget();
    }
    setDeliveryTarget(): void {
        const struct = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {filter:
            (struct) => {
                return (
                    (struct.structureType === STRUCTURE_CONTAINER && struct.store.getFreeCapacity(RESOURCE_ENERGY) >= 50)
                    || (struct.structureType === STRUCTURE_EXTENSION && struct.store.getFreeCapacity(RESOURCE_ENERGY) >= 50)
                    || (struct.structureType === STRUCTURE_SPAWN && struct.store.getFreeCapacity(RESOURCE_ENERGY) >= 50)
                );
            }
        });
        if (!struct)
            return;
        // console.log(`delivering to ${JSON.stringify(struct)}`)
        this.chosenTargetId = struct.id;
    }
    setHarvestTarget(): void {
        const source = this.findNearestNonemptySource();
        if (!source)
            return;
        if (source?.id)
            this.chosenTargetId = source.id;
    }
    decideNextState(): void {
        // harvesting and we fill up
        if (this.state === HarvestState && this.energyIsFull()) {
            this.state = DeliverState;
            this.chosenTargetId = undefined;
        }
        // delivering and we run out
        else if (this.state === DeliverState && this.energyIsEmpty()) {
            this.state = HarvestState;
            this.chosenTargetId = undefined;
        }
        else {
            this.state = HarvestState;
            this.chosenTargetId = undefined;
        }

        if (!this.chosenTargetId) {
            if (this.state === DeliverState)
                this.setDeliveryTarget();
            else if (this.state === HarvestState)
                this.setHarvestTarget();
        }

    }
}




export type CreepGroups = {
    // A mapped type may not declare properties or methods.ts(7061)
    [role in RoleType]: Creep[];
}
export function groupCreepsByRole(creeps: Creep[]): CreepGroups {
    const groups: CreepGroups = {} as CreepGroups;
    for (let role in RoleType)
        groups[RoleType[role as keyof typeof RoleType]] = [];

    for (const creep of creeps) {
        let role = creep.memory.role as RoleType;
        if (!role) {
            role = RoleType.Harvester;
            creep.memory.role = role;
        }

        groups[role].push(creep);
    }

    return groups;
}
