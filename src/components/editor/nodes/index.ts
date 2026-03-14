import type { NodeTypes } from "@xyflow/react";
import { PersonNode } from "./person-node";
import { SystemNode } from "./system-node";
import { ContainerNode } from "./container-node";
import { StoreNode } from "./store-node";
import { ComponentNode } from "./component-node";
import { GroupNode } from "./group-node";

export const nodeTypes: NodeTypes = {
  actor: PersonNode,
  group: GroupNode,
  system: SystemNode,
  app: ContainerNode,
  store: StoreNode,
  component: ComponentNode,
};
