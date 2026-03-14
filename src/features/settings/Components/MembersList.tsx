"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Search, UserPlus } from "lucide-react";
import type { OrgMember } from "../Actions/members";
import {
  searchUsers,
  addMember,
  removeMember,
  updateMemberRole,
} from "../Actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SearchResult = { id: string; name: string; email: string };

const roleLabels: Record<string, string> = {
  owner: "Eier",
  admin: "Admin",
  member: "Medlem",
};

type Props = {
  members: OrgMember[];
  currentUserRole: string;
};

export function MembersList({ members, currentUserRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  async function handleSearch() {
    if (query.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const users = await searchUsers(query);
      setResults(users);
      if (users.length === 0) {
        setError("Ingen brukere funnet.");
      }
    } catch {
      setError("Søk feilet.");
    } finally {
      setSearching(false);
    }
  }

  function handleAdd(userId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await addMember(userId);
        setResults((prev) => prev.filter((u) => u.id !== userId));
        setQuery("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunne ikke legge til bruker.");
      }
    });
  }

  function handleRemove() {
    if (!removeId) return;
    startTransition(async () => {
      try {
        await removeMember(removeId);
        setRemoveId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunne ikke fjerne medlem.");
      }
    });
  }

  function handleRoleChange(memberId: string, role: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateMemberRole(memberId, role);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunne ikke endre rolle.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legg til medlem</CardTitle>
            <CardDescription>
              Søk etter en registrert bruker for å legge til i organisasjonen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <Input
                placeholder="Søk etter navn eller e-post..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={searching || query.length < 2}>
                <Search className="mr-1 size-4" />
                Søk
              </Button>
            </form>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {results.length > 0 && (
              <Table>
                <TableBody>
                  {results.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleAdd(user.id)}
                          disabled={isPending}
                        >
                          <UserPlus className="mr-1 size-4" />
                          Legg til
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medlemmer</CardTitle>
          <CardDescription>
            Brukere med tilgang til denne organisasjonen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.user.name}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    {isOwner && member.role !== "owner" ? (
                      <Select
                        value={member.role}
                        onValueChange={(role) => handleRoleChange(member.id, role)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Medlem</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={member.role === "owner" ? "default" : "secondary"}
                      >
                        {roleLabels[member.role] ?? member.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemoveId(member.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern medlem?</AlertDialogTitle>
            <AlertDialogDescription>
              Brukeren mister tilgang til denne organisasjonen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isPending}>
              Fjern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
