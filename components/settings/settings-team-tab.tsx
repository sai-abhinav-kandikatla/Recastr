"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Users, Shield, ShieldAlert, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrentUser } from "@/lib/current-user";

type Organization = {
  id: string;
  name: string;
  slug: string;
  _count: { memberships: number; projects: number };
};

type Membership = {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

function getErrorMessage(errorPayload: any): string {
  if (!errorPayload) return "An unknown error occurred";
  if (typeof errorPayload.error === "string") return errorPayload.error;
  if (typeof errorPayload.error === "object" && errorPayload.error !== null) {
    return errorPayload.error.message || "An unknown error occurred";
  }
  return errorPayload.message || "An unknown error occurred";
}

export function SettingsTeamTab({ currentUser }: { currentUser?: CurrentUser | null }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json() as Promise<Organization[]>;
    },
  });

  const activeOrgId = selectedOrgId ?? orgsQuery.data?.[0]?.id;

  const membersQuery = useQuery({
    queryKey: ["organization-members", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];
      const res = await fetch(`/api/organizations/${activeOrgId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json() as Promise<Membership[]>;
    },
    enabled: !!activeOrgId,
  });

  const createOrgMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName, slug: newOrgSlug }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(getErrorMessage(error) || "Failed to create organization");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization created successfully");
      setIsCreating(false);
      setNewOrgName("");
      setNewOrgSlug("");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrgId) return;
      const res = await fetch(`/api/organizations/${activeOrgId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: "member" }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(getErrorMessage(error) || "Failed to invite user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Invitation sent");
      setInviteEmail("");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Organizations Header */}
      <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Organizations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your teams, workspaces, and collaboration settings.
            </p>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Organization
          </Button>
        </div>

        {isCreating && (
          <div className="mt-6 rounded-xl border border-[var(--app-line-strong)] bg-[var(--app-panel)] p-5 space-y-4">
            <h4 className="font-medium">Create New Workspace</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  placeholder="Acme Corp"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Organization Slug (URL)</Label>
                <Input
                  placeholder="acme-corp"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button disabled={!newOrgName || !newOrgSlug || createOrgMutation.isPending} onClick={() => createOrgMutation.mutate()}>
                {createOrgMutation.isPending ? "Creating..." : "Create Workspace"}
              </Button>
            </div>
          </div>
        )}

        {orgsQuery.isLoading ? (
          <div className="mt-6 h-20 animate-pulse rounded-lg bg-[var(--app-panel)]" />
        ) : orgsQuery.data && orgsQuery.data.length > 0 ? (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {orgsQuery.data.map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrgId(org.id)}
                className={`flex min-w-[240px] flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  activeOrgId === org.id
                    ? "border-[var(--violet)] bg-[var(--violet)]/5 shadow-[0_0_0_1px_var(--violet)]"
                    : "border-[var(--app-line)] bg-[var(--app-bg)] hover:border-[var(--app-line-strong)]"
                }`}
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--app-panel)] text-[var(--violet)]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  {activeOrgId === org.id && <div className="h-2 w-2 rounded-full bg-[var(--violet)]" />}
                </div>
                <h4 className="mt-3 font-medium">{org.name}</h4>
                <p className="text-xs text-muted-foreground">{org._count.projects} projects</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--app-line-strong)] py-12">
            <Building2 className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No organizations found</p>
            <p className="text-xs text-muted-foreground">Create one to collaborate with your team</p>
          </div>
        )}
      </div>

      {/* Members Section */}
      {activeOrgId && (
        <div className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Team Members</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage access and roles for this workspace.
              </p>
            </div>
          </div>

          <div className="mb-6 flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label>Invite new member</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="colleague@example.com" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                />
                <Button 
                  disabled={!inviteEmail || inviteMutation.isPending} 
                  onClick={() => inviteMutation.mutate()}
                  className="gap-2 shrink-0"
                >
                  <Mail className="h-4 w-4" />
                  Send Invite
                </Button>
              </div>
            </div>
          </div>

          {membersQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--app-panel)]" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[var(--app-line)] rounded-xl border border-[var(--app-line)] bg-[var(--app-bg)] overflow-hidden">
              {membersQuery.data?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-panel)] font-medium">
                      {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.user.name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-md bg-[var(--app-surface)] px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {member.role === "owner" && <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />}
                      {member.role === "admin" && <Shield className="h-3.5 w-3.5 text-blue-500" />}
                      {member.role === "member" && <Users className="h-3.5 w-3.5" />}
                      <span className="capitalize">{member.role}</span>
                    </div>
                    {currentUser?.id !== member.user.id && (
                      <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
