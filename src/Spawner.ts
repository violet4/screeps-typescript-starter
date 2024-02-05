import { RoleType } from "creep/Creeper";

export class Spawner {
    spawner: StructureSpawn;
    constructor(spawner: StructureSpawn) {
        this.spawner = spawner;
    }
    runIsDone() {
        //
    }
    spawnSomeCreep(body: BodyPartConstant[], role: RoleType) {
        if (this.spawner.spawning)
            return;
        const new_creep_count = parseInt(Memory.creepCount.toString()) + 1;
        if (this.spawner.spawnCreep(body, new_creep_count.toString(), {memory: {
            role: role,
            chosenTargetId: "",
            state: "",
            movementState: "",
        }})===OK) {
            Memory.creepCount = new_creep_count;
            return true;
        }
        return false;
    }
    spawnHarvester() {
        return this.spawnSomeCreep([WORK, CARRY, MOVE, MOVE], RoleType.Harvester);
    }
    spawnUpgrader() {
        return this.spawnSomeCreep([WORK, CARRY, MOVE, MOVE], RoleType.Upgrader);
    }
    spawnWorker() {
        return this.spawnSomeCreep([WORK, CARRY, MOVE, MOVE], RoleType.Worker);
    }
    spawnBuilder() {
        return this.spawnSomeCreep([WORK, CARRY, MOVE, MOVE], RoleType.Builder);
    }
    isActive(): boolean {
        return this.spawner.isActive();
    }

    public get spawning() : Spawning | null {
        return this.spawner.spawning;
    }

}
