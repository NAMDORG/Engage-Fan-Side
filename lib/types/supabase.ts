type Profile = {
    id: string; // UUID
    created_at?: string; // timestamptz
    email?: string;
    display_name?: string;
    phone_number?: string;
    shipping_street: string;
    shipping_po: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    billing_street: string;
    billing_po: string;
    billing_city: string;
    billing_state: string;
    billing_zip: string;
    is_admin: boolean;
};

type Artist = {
    id: number; // int8
    created_at?: string; // timestamptz
    slug?: string;
    name?: string;
    photo?: string;
    logo?: string;
    icon?: string;
    active_campaign?: number | null; // int8
    contact?: string;
    status: string;
    public_url: string;
};

type Campaign = {
    id: number; // int8
    created_at?: string; // timestamptz
    name: string;
    slug?: string;
    artist?: number; // int8
    background?: string; // Image URL
    logo?: string; // Image URL
    support?: string; // Image URL
    manager_name?: string;
    manager_contact?: string;
    color_text_primary?: string;
    color_text_secondary?: string;
    color_background?: string;
    color_accent?: string;
    color_cta?: string;
    restricted: boolean;
    password?: string;
    status: string;
};

type Event = {
    id: number; // int8
    created_at?: string; // timestamptz
    artist?: number; // int8
    campaign?: number; // int8
    contact_name?: string;
    contact?: string;
    date?: string; // date as string
    time?: string; // time as string
    public_url?: string;
    venue: number;
    age: string;
    vip_time?: string;
};

type Venue = {
    id: number; // int8
    created_at?: string; // timestamptz
    name?: string;
    address?: string;
    city_state?: string;
};

type Product = {
    id: number; // int8
    created_at?: string; // timestamptz
    artist?: number; // int8
    name?: string;
    details?: string;
    image_primary?: string; // Image URL
    price?: number; // int2
    service_fee?: number; // int2
};

type Event_Product = {
    id: number; // int8
    created_at?: string; // timestamptz
    event_id?: number; // int8
    product_id?: number; // int8
    quantity?: number;
};

type Access_Grant = {
    id: string; // UUID
    user_id: string; // UUID
    artist_id?: number; // int8
    campaign_id?: number; // int8
    event_id?: number; // int8
    role: string;
    created_at?: string; // timestamptz
    updated_at?: string; //timestamptz
};

export type {
    Profile,
    Artist,
    Campaign,
    Event,
    Venue,
    Product,
    Event_Product,
    Access_Grant,
};
