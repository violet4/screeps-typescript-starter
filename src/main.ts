import { RoleType } from "creep/Creep";
import { MovementState } from "creep/Creep";
import { ErrorMapper } from "utils/ErrorMapper";
// import harvesterRun from "roles/harvester";


export type Success = "Success"
export const Success: Success = "Success"
export type Failure = "Failure"
export const Failure: Failure = "Failure"
export type ReachedDestination = "ReachedDestination"
export const ReachedDestination: ReachedDestination = "ReachedDestination"

declare global {
    // Syntax for adding proprties to `global` (ex "global.log")
    namespace NodeJS {
        interface Global {
            log: any;
        }
    }
}

export const loop = ErrorMapper.wrapLoop(() => {
    console.log("Hello");
    for (let creepName in Game.creeps) {
        let creep: Creep = Game.creeps[creepName];
        creep.run();
    }
    for (let structureName in Game.structures) {
        let structure = Game.structures[structureName];
        // structure.run();
    }

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
});
