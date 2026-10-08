// Hand-written mirror of supabase/migrations, in the same shape `supabase gen types` emits.
// Replace with the generated file once the project exists:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

type MemberRole = 'dm' | 'player';
type Visibility = 'dm' | 'party';
type EntityType = 'npc' | 'location' | 'faction' | 'item' | 'document';

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_public?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_members: {
        Row: {
          campaign_id: string;
          user_id: string;
          role: MemberRole;
        };
        Insert: {
          campaign_id: string;
          user_id: string;
          role: MemberRole;
        };
        Update: {
          campaign_id?: string;
          user_id?: string;
          role?: MemberRole;
        };
        Relationships: [
          {
            foreignKeyName: 'campaign_members_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          campaign_id: string;
          number: number;
          title: string | null;
          played_on: string | null;
          recap_md: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          number: number;
          title?: string | null;
          played_on?: string | null;
          recap_md?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          number?: number;
          title?: string | null;
          played_on?: string | null;
          recap_md?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
        ];
      };
      entities: {
        Row: {
          id: string;
          campaign_id: string;
          type: EntityType;
          name: string;
          summary: string | null;
          image_path: string | null;
          tags: string[];
          visibility: Visibility;
          revealed_in: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          type: EntityType;
          name: string;
          summary?: string | null;
          image_path?: string | null;
          tags?: string[];
          visibility?: Visibility;
          revealed_in?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          type?: EntityType;
          name?: string;
          summary?: string | null;
          image_path?: string | null;
          tags?: string[];
          visibility?: Visibility;
          revealed_in?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'entities_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'entities_revealed_in_fkey';
            columns: ['revealed_in'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      blocks: {
        Row: {
          id: string;
          entity_id: string;
          campaign_id: string;
          sort_order: number;
          title: string | null;
          body_md: string;
          visibility: Visibility;
          revealed_in: string | null;
        };
        Insert: {
          id?: string;
          entity_id: string;
          campaign_id: string;
          sort_order?: number;
          title?: string | null;
          body_md?: string;
          visibility?: Visibility;
          revealed_in?: string | null;
        };
        Update: {
          id?: string;
          entity_id?: string;
          campaign_id?: string;
          sort_order?: number;
          title?: string | null;
          body_md?: string;
          visibility?: Visibility;
          revealed_in?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blocks_entity_id_campaign_id_fkey';
            columns: ['entity_id', 'campaign_id'];
            isOneToOne: false;
            referencedRelation: 'entities';
            referencedColumns: ['id', 'campaign_id'];
          },
          {
            foreignKeyName: 'blocks_revealed_in_fkey';
            columns: ['revealed_in'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      links: {
        Row: {
          id: string;
          campaign_id: string;
          from_id: string;
          to_id: string;
          label: string;
          visibility: Visibility;
          revealed_in: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          from_id: string;
          to_id: string;
          label: string;
          visibility?: Visibility;
          revealed_in?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          from_id?: string;
          to_id?: string;
          label?: string;
          visibility?: Visibility;
          revealed_in?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'links_from_id_campaign_id_fkey';
            columns: ['from_id', 'campaign_id'];
            isOneToOne: false;
            referencedRelation: 'entities';
            referencedColumns: ['id', 'campaign_id'];
          },
          {
            foreignKeyName: 'links_to_id_campaign_id_fkey';
            columns: ['to_id', 'campaign_id'];
            isOneToOne: false;
            referencedRelation: 'entities';
            referencedColumns: ['id', 'campaign_id'];
          },
          {
            foreignKeyName: 'links_revealed_in_fkey';
            columns: ['revealed_in'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_dm: { Args: { c: string }; Returns: boolean };
      is_public_campaign: { Args: { c: string }; Returns: boolean };
    };
    Enums: {
      member_role: MemberRole;
      visibility: Visibility;
      entity_type: EntityType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
