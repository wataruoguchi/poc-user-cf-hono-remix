import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { UniqueEnforcer } from "enforce-unique";
import { Access, Action, Entity } from "~/utils/permissions.server";

const uniqueUsernameEnforcer = new UniqueEnforcer();

export function createUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  const username = uniqueUsernameEnforcer
    .enforce(() => {
      return (
        faker.string.alphanumeric({ length: 2 }) +
        "_" +
        faker.internet.username({
          firstName: firstName.toLowerCase(),
          lastName: lastName.toLowerCase(),
        })
      );
    })
    .slice(0, 20)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  return {
    id: crypto.randomUUID(),
    username,
    email: `${username}@example.com`,
  };
}

export function createPassword(password: string = faker.internet.password()) {
  return {
    hash: bcrypt.hashSync(password, 10),
  };
}

const entities: Entity[] = ["user", "note"] as const;
const actions: Action[] = ["create", "read", "update", "delete"] as const;
const accesses: Access[] = ["own", "any"] as const;
export function createPermissions() {
  return entities.flatMap((entity) =>
    actions.flatMap((action) =>
      accesses.map((access) => ({
        id: crypto.randomUUID(),
        action,
        entity,
        access,
      }))
    )
  );
}

const roleNames = ["admin", "user"] as const;
export function createRoles() {
  return roleNames.map((name) => ({
    id: crypto.randomUUID(),
    name,
  }));
}
