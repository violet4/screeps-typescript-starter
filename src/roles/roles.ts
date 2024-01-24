import { any } from "lodash";

export enum RoleType {
    Harvester = "Harvester",
    Worker = "Worker",
}

// 'ScreepsReturnCode' only refers to a type, but is being used as a value here.ts(2693)
const spawn_exit_codes: {[key: number]: string} = {
    [OK]: "OK",
    [ERR_NOT_OWNER]: "ERR_NOT_OWNER",
    [ERR_NO_PATH]: "ERR_NO_PATH",
    [ERR_BUSY]: "ERR_BUSY",
    [ERR_NAME_EXISTS]: "ERR_NAME_EXISTS",
    [ERR_NOT_FOUND]: "ERR_NOT_FOUND",
    [ERR_NOT_ENOUGH_RESOURCES]: "ERR_NOT_ENOUGH_RESOURCES, ERR_NOT_ENOUGH_ENERGY, ERR_NOT_ENOUGH_EXTENSIONS",
    [ERR_INVALID_TARGET]: "ERR_INVALID_TARGET",
    [ERR_FULL]: "ERR_FULL",
    [ERR_NOT_IN_RANGE]: "ERR_NOT_IN_RANGE",
    [ERR_INVALID_ARGS]: "ERR_INVALID_ARGS",
    [ERR_TIRED]: "ERR_TIRED",
    [ERR_NO_BODYPART]: "ERR_NO_BODYPART",
    [ERR_RCL_NOT_ENOUGH]: "ERR_RCL_NOT_ENOUGH",
    [ERR_GCL_NOT_ENOUGH]: "ERR_GCL_NOT_ENOUGH",
}

type finished = boolean


class Role {
    creep: Creep;
    constructor(creep: Creep) {
        this.creep = creep;
    }
    static bodyParts(): BodyPartConstant[] {
        return [MOVE];
    }
    static roleType(): RoleType {
        return RoleType.Harvester;
    }
    roleType(): RoleType {
        return RoleType.Harvester;
    }
    static memory(): CreepMemory {
        return {
            role: this.roleType(),
            room: "",
            chosenTargetId: "",
            state: "",
        };
    }
    getNearestSource() {
        var sources = this.creep.room.find(FIND_SOURCES);
        if(this.creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
    getNearestEnergy() {
        // return this.creep.room.find(FIND_STRUCTURES)
        //     .filter(st => st.structureType=='container')
        //     .map(st => [st,Game.creeps["21"].pos.getRangeTo(st.pos)])
        //     .sort(([st1,dist1], [st2,dist2]) => dist1-dist2)[0][0].pos;
        const containers = this.creep.room.find<StructureContainer>(
            FIND_STRUCTURES, {filter: struct => (struct.structureType==STRUCTURE_CONTAINER
                                                 && struct.store.energy > 0)}
        );
        if (containers.length===0)
            return this.getNearestSource();
        const nearest_container: StructureContainer = _.min(containers, container => this.creep.pos.getRangeTo(container));
        const retCode: ScreepsReturnCode = this.creep.withdraw(nearest_container, RESOURCE_ENERGY);
        if (retCode === ERR_NOT_IN_RANGE)
            this.creep.moveTo(nearest_container, {visualizePathStyle: {stroke: "#ffffff"}});
    }
    getNearestRepairableStructure(structure_id:string|null=null): AnyStructure|null {
        if (structure_id)
            return Game.getObjectById(structure_id) as AnyStructure;
        const structures = this.creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.hits < structure.hitsMax &&
                       structure.structureType !== STRUCTURE_WALL &&
                       structure.structureType !== STRUCTURE_RAMPART;
            }
        });
        let damagedTarget = null;
        let minHits = Number.MAX_VALUE;
        structures.forEach((struct) => {
            const hits = struct.hits/struct.hitsMax;
            if (hits < minHits) {
                minHits = hits;
                damagedTarget = struct;
            }
        })
        return damagedTarget;
    }
    repairNearestStructure(structure_id: string|null) {
        const damagedTarget = this.getNearestRepairableStructure(structure_id);
        if (damagedTarget) {
            if(this.creep.repair(damagedTarget)==ERR_NOT_IN_RANGE) {
                this.creep.moveTo(damagedTarget, {visualizePathStyle: {stroke: '#ffffff'}})
            }
        }
    }
    run(): finished {
        //TODO if we're not doing anything, move away from source
        if (!this.creep.memory.healing && !this.creep.memory.working && (this.creep.ticksToLive??101) < 100) {
            this.creep.memory.healing = true;
        }
        else if (this.creep.memory.healing && this.creep.ticksToLive && this.creep.ticksToLive > 1000)
            this.creep.memory.healing = false;

        if (this.creep.memory.healing) {
            const creep = this.creep;
            var spawns: StructureSpawn[] = this.creep.room.find(FIND_MY_SPAWNS);
            spawns.map(function calcDistance(spawn:StructureSpawn): [number, RoomPosition] {
                return [spawn.pos.getRangeTo(creep.pos), spawn.pos];
            }).sort(function compareDistance(a: [number, RoomPosition], b: [number, RoomPosition]): number {
                return a[0]-b[0];
            });
            if (spawns.length>0) {
                const targetSpawn = spawns[0];
                if (targetSpawn.renewCreep(creep) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(targetSpawn.pos, {visualizePathStyle: {stroke: '#ffaa00'}});
                // console.log(`${creep.name} getting renewed!! ticks remaining ${creep.ticksToLive}`);
            }
            // console.log(JSON.stringify(spawns));

            return true;
        }
        return false;
        // if (this.creep.memory.working) {
        //     this.renew();
        // }
        // console.log(this.roleType().valueOf().toString());
    }
    static spawn(spawn: StructureSpawn): ScreepsReturnCode {
        if (Memory.creepCount===undefined)
            Memory.creepCount = 0;
        const nextCreep = Memory.creepCount+1;
        const retCode: ScreepsReturnCode = spawn.spawnCreep(
            this.bodyParts(),
            // TODO only use .length for the objects that are actually this role type.
            nextCreep.toString(),
            {memory: this.memory()});
        if (retCode == OK) Memory.creepCount = nextCreep;
        else console.log(`Failed to spawn creep ${nextCreep} ${this.roleType().toString()}; ${spawn_exit_codes[retCode]}`);
        return retCode;
    }

    renew(): void {
        // console.log(`this.creep.memory.room: ${this.creep.memory.room}`);
        // Implementation of renew
    }
}

class WorkerRole extends Role {
    static bodyParts(): BodyPartConstant[] {
        return [WORK, CARRY, ...super.bodyParts()];
    }
}
class DistributerRole extends WorkerRole {}
class HarvesterRole extends WorkerRole {
    static roleType(): RoleType {
        return RoleType.Harvester;
    }
    roleType(): RoleType {
        return RoleType.Harvester;
    }
    run(): finished {
        if (super.run())
            return true;

        // get energy

        if(this.creep.store.getFreeCapacity() > 0) {
            var sources = this.creep.room.find(FIND_SOURCES);
            if(this.creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
                // console.log("moving towards energy source");
            }
            else {
                // console.log("harvesting source");
            }
        }
        else {
            // find energy-storing structures that aren't full
            var targets = this.creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_CONTAINER ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) &&
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            // TODO fill spawn first before containers
            if(targets.length > 0) {
                targets.sort((a,b) => this.creep.pos.getRangeTo(a)-this.creep.pos.getRangeTo(b));
                // console.log(`${this.creep.name} targets:`, targets.map(t => `${this.creep.pos.getRangeTo(t.pos)} ${t.structureType}`));
                if(this.creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    // console.log("moving towards structure that needs energy");
                }
                else {
                    // console.log("transferred energy to structure");
                }
            }
            else {
                // console.log("no structures need energy")
                const destination = Game.flags['harvesters'].pos;
                this.creep.moveTo(destination.x, destination.y);
                // console.log(JSON.stringify(Game.flags))
            }
        }
        return false;
    }
}
class BigHarvesterRole extends HarvesterRole {
    static bodyParts(): BodyPartConstant[] {
        return [WORK,WORK,WORK,MOVE, ...super.bodyParts()];
    }

    static roleType(): RoleType {return RoleType.BigHarvester;}
    roleType(): RoleType {return RoleType.BigHarvester;}

}

export class BuilderRole extends WorkerRole {
    static roleType(): RoleType {
        return RoleType.Builder;
    }
    roleType(): RoleType {
        return RoleType.Builder;
    }
    run(): finished {
        if (super.run())
            return true;

            // finite state machine
        if(this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] == 0) {
            this.creep.memory.working = false;
            this.creep.say('🔄 harvest');
        }
        if(!this.creep.memory.working && this.creep.store.getFreeCapacity() == 0) {
            this.creep.memory.working = true;
            this.creep.say('🚧 build');
        }

        if(this.creep.memory.working) {
            var targets = this.creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                this.creep.pos.x
                var sources = this.creep.room.find(FIND_SOURCES);
                if (any(sources.map((source) => this.creep.pos.getRangeTo(source.pos) < 3)))
                    this.creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});

                else if(this.creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
        else {
            this.getNearestEnergy();
        }
        return false;
    }
}
class RepairerRole extends WorkerRole {
    static roleType(): RoleType {
        return RoleType.Repairer;
    }
    roleType(): RoleType {
        return RoleType.Repairer;
    }
    run(): finished {
        if (super.run())
            return true;

        if(this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] == 0) {
            this.creep.memory.working = false;
            this.creep.say('🔄 harvest');
        }
        if(!this.creep.memory.working && this.creep.store.getFreeCapacity() == 0) {
            this.creep.memory.working = true;
            this.creep.say('🚧 repair');
            const damagedTarget = this.getNearestRepairableStructure();
            if (damagedTarget)
                this.creep.memory.chosenTargetId = damagedTarget.id;
        }

        if(this.creep.memory.working) {
            this.repairNearestStructure(this.creep.memory.chosenTargetId);
        }
        else {
            this.creep.memory.chosenTargetId = "";
            this.getNearestEnergy();
        }
        return false;
    }
}
class UpgraderRole extends WorkerRole {
    static roleType(): RoleType {
        return RoleType.Upgrader;
    }
    roleType(): RoleType {
        return RoleType.Upgrader;
    }
    run(): finished {
        if (super.run())
            return true;
        // finite state machine between gathering and upgrading
        if(this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] == 0) {
            this.creep.memory.working = false;
            this.creep.say('🔄 harvest');
        }
        if(!this.creep.memory.working && this.creep.store.getFreeCapacity() == 0) {
            this.creep.memory.working = true;
            this.creep.say('⚡ upgrade');
        }

        if(this.creep.memory.working) {
            if (this.creep.room.controller === undefined) {}
                // console.log(`ERROR: want to upgrade but ${this.creep.name} isn't in a room with a controller`);
            else if(this.creep.upgradeController(this.creep.room.controller) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(this.creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else {
            this.getNearestEnergy();
        }
        return false;
    }
}
class DefenderRole extends WorkerRole {
    static roleType(): RoleType {return RoleType.Defender;}
    roleType(): RoleType {return RoleType.Defender;}
    run(): finished {
        return super.run();
    }
}

type RoleDictionary = {
    [key in RoleType]: typeof Role;
}
export const Roles: RoleDictionary = {
    [RoleType.Harvester]: HarvesterRole,
    [RoleType.BigHarvester]: BigHarvesterRole,
    [RoleType.Distributer]: DistributerRole,
    [RoleType.Builder]: BuilderRole,
    [RoleType.Repairer]: RepairerRole,
    [RoleType.Upgrader]: UpgraderRole,
    [RoleType.Defender]: DefenderRole,
};
