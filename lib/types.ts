export interface SiteSettings {
  id: number;
  business_name: string;
  hero_title: string;
  hero_kicker: string;
  hero_subtitle: string;
  hero_tagline: string;
  about_title: string;
  about_eyebrow: string;
  about_body: string;
  booking_notice: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  gift_vouchers_enabled: boolean;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon_key: string;
  sort_order: number;
  is_active: boolean;
}

export interface PriceCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface PriceItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  sort_order: number;
  is_active: boolean;
  booking_group: "first" | "second" | null;
}

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface MailingListSubscriber {
  id: string;
  name: string;
  email: string;
  subscribed_at: string;
  welcome_email_sent: boolean;
}

export interface EmailTemplate {
  id: string;
  template_key: "mailing_list_welcome" | "booking_confirmation";
  subject: string;
  body_html: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  google_event_id: string | null;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface GiftVoucherPreset {
  id: string;
  amount: number;
  sort_order: number;
  is_active: boolean;
}

export interface GiftVoucher {
  id: string;
  code: string;
  amount: number;
  balance: number;
  buyer_name: string;
  buyer_email: string;
  recipient_name: string | null;
  recipient_email: string | null;
  sumup_checkout_id: string | null;
  purchased_at: string;
}

export interface Booking {
  id: string;
  slot_id: string;
  service_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  google_event_id: string | null;
  second_event_id: string | null;
  confirmation_email_sent: boolean;
  created_at: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  total_price: number | null;
  voucher_code_used: string | null;
  voucher_amount_applied: number | null;
}
