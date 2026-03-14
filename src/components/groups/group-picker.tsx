import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { GroupBadge } from "#/components/groups/group-badge";
import { m } from "#/paraglide/messages";

interface WorkspaceGroup {
  id: string;
  name: string;
  color: string;
}

interface GroupPickerProps {
  workspaceGroups: WorkspaceGroup[];
  selectedGroupIds: string[];
  onChange: (groupIds: string[]) => void;
}

export function GroupPicker({
  workspaceGroups,
  selectedGroupIds,
  onChange,
}: GroupPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? workspaceGroups.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()),
      )
    : workspaceGroups;

  const toggle = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      onChange(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      onChange([...selectedGroupIds, groupId]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="text-sm">
              {selectedGroupIds.length > 0
                ? `${selectedGroupIds.length} group${selectedGroupIds.length > 1 ? "s" : ""}`
                : m.group_picker_title()}
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="flex flex-col">
            <div className="p-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={m.group_search_placeholder()}
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-48 overflow-y-auto px-1 pb-1">
              {filtered.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                  {m.group_picker_empty()}
                </p>
              ) : (
                filtered.map((g) => {
                  const isSelected = selectedGroupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                      onClick={() => toggle(g.id)}
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded-sm border ${isSelected ? "border-primary bg-primary text-primary-foreground" : ""}`}
                      >
                        {isSelected && <Check className="size-3" />}
                      </span>
                      <GroupBadge name={g.name} color={g.color} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {selectedGroupIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedGroupIds
            .map((id) => workspaceGroups.find((g) => g.id === id))
            .filter(Boolean)
            .map((g) => (
              <GroupBadge key={g.id} name={g.name} color={g.color} />
            ))}
        </div>
      )}
    </div>
  );
}
