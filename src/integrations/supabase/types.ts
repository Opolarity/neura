export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_types: {
        Row: {
          account_id: number
          account_type_id: number
          created_at: string
          id: number
        }
        Insert: {
          account_id: number
          account_type_id: number
          created_at?: string
          id?: number
        }
        Update: {
          account_id?: number
          account_type_id?: number
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_types_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_types_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_types_account_type_id_fkey"
            columns: ["account_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          created_at: string
          document_number: string
          document_type_id: number
          email: string | null
          id: number
          is_active: boolean
          last_name: string | null
          last_name2: string | null
          middle_name: string | null
          migracode: string | null
          name: string
          show: boolean
          tenant_reference: string | null
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type_id: number
          email?: string | null
          id?: number
          is_active?: boolean
          last_name?: string | null
          last_name2?: string | null
          middle_name?: string | null
          migracode?: string | null
          name: string
          show?: boolean
          tenant_reference?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type_id?: number
          email?: string | null
          id?: number
          is_active?: boolean
          last_name?: string | null
          last_name2?: string | null
          middle_name?: string | null
          migracode?: string | null
          name?: string
          show?: boolean
          tenant_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_codes: {
        Row: {
          created_at: string
          created_by: string
          id: number
          price_list_id: number
          product_variation_id: number
          quantities: number | null
          sequence: number
          stock_movement_id: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          price_list_id: number
          product_variation_id: number
          quantities?: number | null
          sequence: number
          stock_movement_id?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          price_list_id?: number
          product_variation_id?: number
          quantities?: number | null
          sequence?: number
          stock_movement_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "bar_codes_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_codes_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_codes_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          address_reference: string | null
          city_id: number
          contry_id: number
          created_at: string | null
          id: number
          is_active: boolean
          name: string
          neighborhood_id: number
          state_id: number
          ubigeo: string | null
          warehouse_id: number
        }
        Insert: {
          address: string
          address_reference?: string | null
          city_id: number
          contry_id: number
          created_at?: string | null
          id?: number
          is_active?: boolean
          name?: string
          neighborhood_id: number
          state_id: number
          ubigeo?: string | null
          warehouse_id: number
        }
        Update: {
          address?: string
          address_reference?: string | null
          city_id?: number
          contry_id?: number
          created_at?: string | null
          id?: number
          is_active?: boolean
          name?: string
          neighborhood_id?: number
          state_id?: number
          ubigeo?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "branches_contry_id_fkey"
            columns: ["contry_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_contry_id_state_id_city_id_fkey"
            columns: ["contry_id", "state_id", "city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["country_id", "state_id", "id"]
          },
          {
            foreignKeyName: "branches_contry_id_state_id_city_id_neighborhood_id_fkey"
            columns: ["contry_id", "state_id", "city_id", "neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["country_id", "state_id", "city_id", "id"]
          },
          {
            foreignKeyName: "branches_contry_id_state_id_fkey"
            columns: ["contry_id", "state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["country_id", "id"]
          },
          {
            foreignKeyName: "branches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_accounts: {
        Row: {
          account_id: number
          account_number: number | null
          bank: string
          branch_id: number | null
          business_account_type_id: number
          created_at: string
          id: number
          is_active: boolean
          name: string
          total_amount: number
        }
        Insert: {
          account_id?: number
          account_number?: number | null
          bank: string
          branch_id?: number | null
          business_account_type_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          total_amount: number
        }
        Update: {
          account_id?: number
          account_number?: number | null
          bank?: string
          branch_id?: number | null
          business_account_type_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "business_accounts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_accounts_business_account_type_id_fkey"
            columns: ["business_account_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      capabilities: {
        Row: {
          code: string | null
          created_at: string
          function_id: number | null
          group: string | null
          id: number
          name: string
          views: string[] | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          function_id?: number | null
          group?: string | null
          id?: number
          name: string
          views?: string[] | null
        }
        Update: {
          code?: string | null
          created_at?: string
          function_id?: number | null
          group?: string | null
          id?: number
          name?: string
          views?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "capabilities_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_products: {
        Row: {
          cart_id: number
          id: number
          is_active: boolean
          product_price: number
          product_variation_id: number
          quantity: number
          sale_price: number | null
          warehouse_id: number | null
        }
        Insert: {
          cart_id: number
          id?: number
          is_active?: boolean
          product_price: number
          product_variation_id: number
          quantity: number
          sale_price?: number | null
          warehouse_id?: number | null
        }
        Update: {
          cart_id?: number
          id?: number
          is_active?: boolean
          product_price?: number
          product_variation_id?: number
          quantity?: number
          sale_price?: number | null
          warehouse_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_products_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_products_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_products_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          order_id: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          order_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          order_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "carts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: number
          image_url: string | null
          migracode: string | null
          name: string
          parent_category: number | null
        }
        Insert: {
          description?: string | null
          id?: number
          image_url?: string | null
          migracode?: string | null
          name: string
          parent_category?: number | null
        }
        Update: {
          description?: string | null
          id?: number
          image_url?: string | null
          migracode?: string | null
          name?: string
          parent_category?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_fkey"
            columns: ["parent_category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          branch_id: number
          code: string
          id: number
          name: string
          price_list_id: number
          sale_type_id: number
          stock_type_id: number
          url: string | null
          warehouse_id: number
        }
        Insert: {
          branch_id: number
          code: string
          id?: number
          name?: string
          price_list_id: number
          sale_type_id: number
          stock_type_id: number
          url?: string | null
          warehouse_id: number
        }
        Update: {
          branch_id?: number
          code?: string
          id?: number
          name?: string
          price_list_id?: number
          sale_type_id?: number
          stock_type_id?: number
          url?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "channels_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_sale_type_id_fkey"
            columns: ["sale_type_id"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_stock_type_id_fkey"
            columns: ["stock_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          channel_id: number
          created_at: string
          id: number
          media_filename: string | null
          media_mime: string | null
          media_path: string | null
          media_sha256: string | null
          media_size_bytes: number | null
          media_type: string | null
          media_url: string | null
          message: string | null
          phone_number: number | null
          status: string | null
          taken_at: string | null
          taken_by: string | null
          user: string
          whatsapp_user_id: string | null
          whatsapp_username: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          channel_id: number
          created_at?: string
          id?: number
          media_filename?: string | null
          media_mime?: string | null
          media_path?: string | null
          media_sha256?: string | null
          media_size_bytes?: number | null
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          phone_number?: number | null
          status?: string | null
          taken_at?: string | null
          taken_by?: string | null
          user: string
          whatsapp_user_id?: string | null
          whatsapp_username?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          channel_id?: number
          created_at?: string
          id?: number
          media_filename?: string | null
          media_mime?: string | null
          media_path?: string | null
          media_sha256?: string | null
          media_size_bytes?: number | null
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          phone_number?: number | null
          status?: string | null
          taken_at?: string | null
          taken_by?: string | null
          user?: string
          whatsapp_user_id?: string | null
          whatsapp_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "chat_conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      chat_last_conversation_info: {
        Row: {
          account_id: number | null
          address: string | null
          address_reference: string | null
          cart_id: number | null
          channel_id: number
          city_id: number | null
          country_id: number | null
          coupon_code: string | null
          created_at: string
          document_number: string | null
          document_type_id: number | null
          email: string | null
          id: number
          is_active: boolean
          last_name: string | null
          merged_into_id: number | null
          name: string | null
          neighborhood_id: number | null
          order_id: number | null
          payment_method_id: number | null
          phone_number: number | null
          profile_id: string | null
          receipt_data: string | null
          receipt_type: string | null
          reception_person: string | null
          reception_phone: string | null
          shipping_cost: number | null
          shipping_method_id: number | null
          state_id: number | null
          updated_at: string
          whatsapp_user_id: string | null
          whatsapp_username: string | null
        }
        Insert: {
          account_id?: number | null
          address?: string | null
          address_reference?: string | null
          cart_id?: number | null
          channel_id: number
          city_id?: number | null
          country_id?: number | null
          coupon_code?: string | null
          created_at?: string
          document_number?: string | null
          document_type_id?: number | null
          email?: string | null
          id?: number
          is_active?: boolean
          last_name?: string | null
          merged_into_id?: number | null
          name?: string | null
          neighborhood_id?: number | null
          order_id?: number | null
          payment_method_id?: number | null
          phone_number?: number | null
          profile_id?: string | null
          receipt_data?: string | null
          receipt_type?: string | null
          reception_person?: string | null
          reception_phone?: string | null
          shipping_cost?: number | null
          shipping_method_id?: number | null
          state_id?: number | null
          updated_at?: string
          whatsapp_user_id?: string | null
          whatsapp_username?: string | null
        }
        Update: {
          account_id?: number | null
          address?: string | null
          address_reference?: string | null
          cart_id?: number | null
          channel_id?: number
          city_id?: number | null
          country_id?: number | null
          coupon_code?: string | null
          created_at?: string
          document_number?: string | null
          document_type_id?: number | null
          email?: string | null
          id?: number
          is_active?: boolean
          last_name?: string | null
          merged_into_id?: number | null
          name?: string | null
          neighborhood_id?: number | null
          order_id?: number | null
          payment_method_id?: number | null
          phone_number?: number | null
          profile_id?: string | null
          receipt_data?: string | null
          receipt_type?: string | null
          reception_person?: string | null
          reception_phone?: string | null
          shipping_cost?: number | null
          shipping_method_id?: number | null
          state_id?: number | null
          updated_at?: string
          whatsapp_user_id?: string | null
          whatsapp_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_last_conversation_info_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "chat_last_conversation_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_last_conversation_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      cities: {
        Row: {
          country_id: number
          created_at: string
          geo_map: string | null
          id: number
          name: string
          state_id: number
        }
        Insert: {
          country_id: number
          created_at?: string
          geo_map?: string | null
          id?: number
          name: string
          state_id: number
        }
        Update: {
          country_id?: number
          created_at?: string
          geo_map?: string | null
          id?: number
          name?: string
          state_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "t_cities_country_id_state_id_fkey"
            columns: ["country_id", "state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["country_id", "id"]
          },
        ]
      }
      classes: {
        Row: {
          code: string
          created_at: string
          id: number
          is_active: boolean
          module_id: number
          name: string
          parent_class_id: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          is_active?: boolean
          module_id: number
          name: string
          parent_class_id?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          is_active?: boolean
          module_id?: number
          name?: string
          parent_class_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_parent_class_id_fkey"
            columns: ["parent_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints_book: {
        Row: {
          address: string
          age: boolean
          amount_claim: number
          answered_at: string | null
          apoderado_document_number: string | null
          apoderado_document_type_id: number | null
          apoderado_email: string | null
          apoderado_phone: string | null
          city_id: number
          claim_description: string
          claim_type: string
          complaining_request: string
          country_id: number
          created_at: string
          detail: string
          document_number: string
          document_type_id: number
          email: string
          good: string
          id: number
          incident_date: string
          last_name: string
          last_name2: string | null
          name: string
          name_apoderado: string | null
          neighborhood_id: number
          orden_id: string | null
          phone: string
          state_id: number
          status: string
          terms: boolean
        }
        Insert: {
          address: string
          age: boolean
          amount_claim: number
          answered_at?: string | null
          apoderado_document_number?: string | null
          apoderado_document_type_id?: number | null
          apoderado_email?: string | null
          apoderado_phone?: string | null
          city_id: number
          claim_description: string
          claim_type: string
          complaining_request: string
          country_id: number
          created_at?: string
          detail: string
          document_number: string
          document_type_id: number
          email: string
          good: string
          id?: number
          incident_date: string
          last_name: string
          last_name2?: string | null
          name: string
          name_apoderado?: string | null
          neighborhood_id: number
          orden_id?: string | null
          phone: string
          state_id: number
          status?: string
          terms?: boolean
        }
        Update: {
          address?: string
          age?: boolean
          amount_claim?: number
          answered_at?: string | null
          apoderado_document_number?: string | null
          apoderado_document_type_id?: number | null
          apoderado_email?: string | null
          apoderado_phone?: string | null
          city_id?: number
          claim_description?: string
          claim_type?: string
          complaining_request?: string
          country_id?: number
          created_at?: string
          detail?: string
          document_number?: string
          document_type_id?: number
          email?: string
          good?: string
          id?: number
          incident_date?: string
          last_name?: string
          last_name2?: string | null
          name?: string
          name_apoderado?: string | null
          neighborhood_id?: number
          orden_id?: string | null
          phone?: string
          state_id?: number
          status?: string
          terms?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "complaints_book_apoderado_document_type_id_fkey"
            columns: ["apoderado_document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_book_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_book_country_id_state_id_city_id_fkey"
            columns: ["country_id", "state_id", "city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["country_id", "state_id", "id"]
          },
          {
            foreignKeyName: "complaints_book_country_id_state_id_city_id_neighborhood_i_fkey"
            columns: ["country_id", "state_id", "city_id", "neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["country_id", "state_id", "city_id", "id"]
          },
          {
            foreignKeyName: "complaints_book_country_id_state_id_fkey"
            columns: ["country_id", "state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["country_id", "id"]
          },
          {
            foreignKeyName: "complaints_book_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints_book_note: {
        Row: {
          complaints_book_id: number
          id: number
          notes_id: number
        }
        Insert: {
          complaints_book_id: number
          id?: number
          notes_id: number
        }
        Update: {
          complaints_book_id?: number
          id?: number
          notes_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "complaints_book_note_complaints_book_id_fkey"
            columns: ["complaints_book_id"]
            isOneToOne: false
            referencedRelation: "complaints_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_book_note_notes_id_fkey"
            columns: ["notes_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string
          geo_map: string | null
          id: number
          name: string
          phone_code: string | null
        }
        Insert: {
          created_at?: string
          geo_map?: string | null
          id?: number
          name: string
          phone_code?: string | null
        }
        Update: {
          created_at?: string
          geo_map?: string | null
          id?: number
          name?: string
          phone_code?: string | null
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          discount_id: number
          id: number
          order_id: number | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          discount_id: number
          id?: number
          order_id?: number | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          discount_id?: number
          id?: number
          order_id?: number | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      crm_conversation_situations: {
        Row: {
          channel_id: number
          created_at: string
          created_by: string | null
          id: number
          last_row: boolean
          message: string | null
          module_id: number
          phone_number: number | null
          situation_id: number
          status_id: number
          whatsapp_user_id: string | null
        }
        Insert: {
          channel_id: number
          created_at?: string
          created_by?: string | null
          id?: number
          last_row?: boolean
          message?: string | null
          module_id: number
          phone_number?: number | null
          situation_id: number
          status_id: number
          whatsapp_user_id?: string | null
        }
        Update: {
          channel_id?: number
          created_at?: string
          created_by?: string | null
          id?: number
          last_row?: boolean
          message?: string | null
          module_id?: number
          phone_number?: number | null
          situation_id?: number
          status_id?: number
          whatsapp_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversation_situations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_conversation_situations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "crm_conversation_situations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_conversation_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_conversation_situations_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_message_events: {
        Row: {
          billable: boolean | null
          channel_id: number
          chat_conversation_id: number | null
          cost: number | null
          created_at: string
          currency: string | null
          direction: string
          error_code: number | null
          id: number
          meta_conversation_id: string | null
          pricing_category: string | null
          sent_by: string | null
          status: string | null
          template_name: string | null
          updated_at: string
          wamid: string
        }
        Insert: {
          billable?: boolean | null
          channel_id: number
          chat_conversation_id?: number | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          direction?: string
          error_code?: number | null
          id?: number
          meta_conversation_id?: string | null
          pricing_category?: string | null
          sent_by?: string | null
          status?: string | null
          template_name?: string | null
          updated_at?: string
          wamid: string
        }
        Update: {
          billable?: boolean | null
          channel_id?: number
          chat_conversation_id?: number | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          direction?: string
          error_code?: number | null
          id?: number
          meta_conversation_id?: string | null
          pricing_category?: string | null
          sent_by?: string | null
          status?: string | null
          template_name?: string | null
          updated_at?: string
          wamid?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_message_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_message_events_chat_conversation_id_fkey"
            columns: ["chat_conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_message_events_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      crm_message_rates: {
        Row: {
          country_code: string
          created_at: string
          currency: string
          id: number
          pricing_category: string
          rate: number
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          country_code: string
          created_at?: string
          currency: string
          id?: number
          pricing_category: string
          rate: number
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          currency?: string
          id?: number
          pricing_category?: string
          rate?: number
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      customer_levels: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          discount: number
          id: number
          image_url: string | null
          max_points: number | null
          min_points: number
          name: string
          sort_order: number
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          discount?: number
          id?: never
          image_url?: string | null
          max_points?: number | null
          min_points?: number
          name: string
          sort_order: number
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          discount?: number
          id?: never
          image_url?: string | null
          max_points?: number | null
          min_points?: number
          name?: string
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_points_movements: {
        Row: {
          account_id: number
          created_at: string
          id: number
          is_active: boolean
          note: string | null
          quantity: number
        }
        Insert: {
          account_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          note?: string | null
          quantity: number
        }
        Update: {
          account_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          note?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_points_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_points_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
        ]
      }
      customer_profile: {
        Row: {
          activity: string | null
          amount_spent: number | null
          id: number
          orders_quantity: number
          points: number | null
          preferences: string[] | null
        }
        Insert: {
          activity?: string | null
          amount_spent?: number | null
          id?: number
          orders_quantity: number
          points?: number | null
          preferences?: string[] | null
        }
        Update: {
          activity?: string | null
          amount_spent?: number | null
          id?: number
          orders_quantity?: number
          points?: number | null
          preferences?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
        ]
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          id: number
          is_active: boolean
          max_uses: number | null
          max_uses_per_customer: number | null
          price_rule_id: number
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          id?: number
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_customer?: number | null
          price_rule_id: number
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          id?: number
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_customer?: number | null
          price_rule_id?: number
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_price_rule_id_fkey"
            columns: ["price_rule_id"]
            isOneToOne: false
            referencedRelation: "price_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      document_lookup_cache: {
        Row: {
          apellido_materno: string | null
          apellido_paterno: string | null
          checked_at: string
          document_number: string
          document_type: string
          found: boolean
          nombres: string | null
          ok: boolean
          razon_social: string | null
          reason: string | null
        }
        Insert: {
          apellido_materno?: string | null
          apellido_paterno?: string | null
          checked_at?: string
          document_number: string
          document_type: string
          found: boolean
          nombres?: string | null
          ok: boolean
          razon_social?: string | null
          reason?: string | null
        }
        Update: {
          apellido_materno?: string | null
          apellido_paterno?: string | null
          checked_at?: string
          document_number?: string
          document_type?: string
          found?: boolean
          nombres?: string | null
          ok?: boolean
          razon_social?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          code: string | null
          created_at: string
          id: number
          max_length: number | null
          min_length: number | null
          name: string
          person_type: number
          state_code: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          max_length?: number | null
          min_length?: number | null
          name: string
          person_type?: number
          state_code?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          max_length?: number | null
          min_length?: number | null
          name?: string
          person_type?: number
          state_code?: string | null
        }
        Relationships: []
      }
      explosion_material_variations: {
        Row: {
          created_at: string
          explosion_material_id: number
          id: number
          quantity: number
          variation_id: number
        }
        Insert: {
          created_at?: string
          explosion_material_id: number
          id?: number
          quantity: number
          variation_id: number
        }
        Update: {
          created_at?: string
          explosion_material_id?: number
          id?: number
          quantity?: number
          variation_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "explosion_material_variations_explosion_material_id_fkey"
            columns: ["explosion_material_id"]
            isOneToOne: false
            referencedRelation: "explosion_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explosion_material_variations_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      explosion_materials: {
        Row: {
          created_at: string
          explosion_id: number
          id: number
          material_id: number
          quantity: number | null
        }
        Insert: {
          created_at?: string
          explosion_id: number
          id?: number
          material_id: number
          quantity?: number | null
        }
        Update: {
          created_at?: string
          explosion_id?: number
          id?: number
          material_id?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "explosion_materials_explosion_id_fkey"
            columns: ["explosion_id"]
            isOneToOne: false
            referencedRelation: "explosions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explosion_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      explosion_variations: {
        Row: {
          created_at: string
          explosion_id: number
          id: number
          variation_id: number
        }
        Insert: {
          created_at?: string
          explosion_id: number
          id?: number
          variation_id: number
        }
        Update: {
          created_at?: string
          explosion_id?: number
          id?: number
          variation_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "explosion_variations_explosion_id_fkey"
            columns: ["explosion_id"]
            isOneToOne: false
            referencedRelation: "explosions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explosion_variations_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      explosions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: number
          model_code: string | null
          total: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: number
          model_code?: string | null
          total: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: number
          model_code?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "explosions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      functions: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          icon: string | null
          id: number
          location: string[] | null
          menu: boolean | null
          name: string
          order: number | null
          parent_function: number | null
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          icon?: string | null
          id?: number
          location?: string[] | null
          menu?: boolean | null
          name: string
          order?: number | null
          parent_function?: number | null
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          icon?: string | null
          id?: number
          location?: string[] | null
          menu?: boolean | null
          name?: string
          order?: number | null
          parent_function?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "functions_parent_function_fkey"
            columns: ["parent_function"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_history: {
        Row: {
          created_at: string
          detail: string | null
          event_situation: string
          id: number
          invoice_id: number
          last_row: boolean
        }
        Insert: {
          created_at?: string
          detail?: string | null
          event_situation: string
          id?: number
          invoice_id: number
          last_row?: boolean
        }
        Update: {
          created_at?: string
          detail?: string | null
          event_situation?: string
          id?: number
          invoice_id?: number
          last_row?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invoices_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount: number | null
          id: number
          igv: number
          invoice_id: number
          measurement_unit: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount?: number | null
          id?: number
          igv: number
          invoice_id: number
          measurement_unit: string
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount?: number | null
          id?: number
          igv?: number
          invoice_id?: number
          measurement_unit?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_providers: {
        Row: {
          branch_id: number
          created_at: string
          default: boolean
          description: string | null
          id: number
          token: string
          url: string
        }
        Insert: {
          branch_id: number
          created_at?: string
          default?: boolean
          description?: string | null
          id?: number
          token: string
          url: string
        }
        Update: {
          branch_id?: number
          created_at?: string
          default?: boolean
          description?: string | null
          id?: number
          token?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_providers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_series: {
        Row: {
          account_id: number
          created_at: string
          id: number
          invoice_provider_id: number
          invoice_type_id: number
          is_active: boolean
          next_number: number
          serie: string | null
        }
        Insert: {
          account_id: number
          created_at?: string
          id?: number
          invoice_provider_id: number
          invoice_type_id: number
          is_active?: boolean
          next_number: number
          serie?: string | null
        }
        Update: {
          account_id?: number
          created_at?: string
          id?: number
          invoice_provider_id?: number
          invoice_type_id?: number
          is_active?: boolean
          next_number?: number
          serie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_series_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_series_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "invoice_series_invoice_provider_id_fkey"
            columns: ["invoice_provider_id"]
            isOneToOne: false
            referencedRelation: "invoice_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_series_invoice_type_id_fkey"
            columns: ["invoice_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cdr_url: string | null
          client_address: string | null
          client_email: string | null
          client_name: string | null
          created_at: string
          created_by: string
          customer_document_estate_code: string | null
          customer_document_number: string
          customer_document_type_id: number
          declared: boolean
          id: number
          invoice_number: string | null
          invoice_type_id: number
          pdf_url: string | null
          qr_data: string | null
          tax_serie: string | null
          total_amount: number
          total_free: number | null
          total_others: number | null
          total_taxes: number | null
          vinculated_invoice_id: number | null
          xml_url: string | null
        }
        Insert: {
          cdr_url?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string
          customer_document_estate_code?: string | null
          customer_document_number?: string
          customer_document_type_id?: number
          declared?: boolean
          id?: number
          invoice_number?: string | null
          invoice_type_id: number
          pdf_url?: string | null
          qr_data?: string | null
          tax_serie?: string | null
          total_amount: number
          total_free?: number | null
          total_others?: number | null
          total_taxes?: number | null
          vinculated_invoice_id?: number | null
          xml_url?: string | null
        }
        Update: {
          cdr_url?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string
          customer_document_estate_code?: string | null
          customer_document_number?: string
          customer_document_type_id?: number
          declared?: boolean
          id?: number
          invoice_number?: string | null
          invoice_type_id?: number
          pdf_url?: string | null
          qr_data?: string | null
          tax_serie?: string | null
          total_amount?: number
          total_free?: number | null
          total_others?: number | null
          total_taxes?: number | null
          vinculated_invoice_id?: number | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "invoices_customer_document_type_id_fkey"
            columns: ["customer_document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_invoice_type_id_fkey"
            columns: ["invoice_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vinculated_invoice_id_fkey"
            columns: ["vinculated_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices_gre: {
        Row: {
          conductor_apellidos: string | null
          conductor_dni: string | null
          conductor_licencia: string | null
          conductor_nombre: string | null
          fecha_traslado: string
          id: number
          llegada_direccion: string
          llegada_ubigeo: string
          motivo_traslado: string
          numero_bultos: number
          partida_direccion: string
          partida_ubigeo: string
          peso_bruto_total: number
          peso_unidad: string
          placa: string
          tipo_transporte: string
          transportista_nombre: string | null
          transportista_ruc: string | null
        }
        Insert: {
          conductor_apellidos?: string | null
          conductor_dni?: string | null
          conductor_licencia?: string | null
          conductor_nombre?: string | null
          fecha_traslado: string
          id: number
          llegada_direccion: string
          llegada_ubigeo: string
          motivo_traslado: string
          numero_bultos: number
          partida_direccion: string
          partida_ubigeo: string
          peso_bruto_total: number
          peso_unidad?: string
          placa: string
          tipo_transporte: string
          transportista_nombre?: string | null
          transportista_ruc?: string | null
        }
        Update: {
          conductor_apellidos?: string | null
          conductor_dni?: string | null
          conductor_licencia?: string | null
          conductor_nombre?: string | null
          fecha_traslado?: string
          id?: number
          llegada_direccion?: string
          llegada_ubigeo?: string
          motivo_traslado?: string
          numero_bultos?: number
          partida_direccion?: string
          partida_ubigeo?: string
          peso_bruto_total?: number
          peso_unidad?: string
          placa?: string
          tipo_transporte?: string
          transportista_nombre?: string | null
          transportista_ruc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_gre_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_stock_movement_requests: {
        Row: {
          approved: boolean | null
          id: number
          stock_movement_id: number
          stock_movement_request_id: number
        }
        Insert: {
          approved?: boolean | null
          id?: number
          stock_movement_id: number
          stock_movement_request_id: number
        }
        Update: {
          approved?: boolean | null
          id?: number
          stock_movement_id?: number
          stock_movement_request_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "linked_stock_movement_requests_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_stock_movement_requests_stock_movement_request_id_fkey"
            columns: ["stock_movement_request_id"]
            isOneToOne: false
            referencedRelation: "stock_movement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_imagenes_redimensionadas: {
        Row: {
          "24939-0.webp": string | null
        }
        Insert: {
          "24939-0.webp"?: string | null
        }
        Update: {
          "24939-0.webp"?: string | null
        }
        Relationships: []
      }
      material_stock: {
        Row: {
          created_at: string
          id: number
          material_id: number
          stock: number
          stock_type_id: number
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          material_id: number
          stock: number
          stock_type_id: number
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          created_at?: string
          id?: number
          material_id?: number
          stock?: number
          stock_type_id?: number
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_stock_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_stock_type_id_fkey"
            columns: ["stock_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "material_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      material_stock_movements: {
        Row: {
          completed: boolean
          created_at: string
          created_by: string | null
          id: number
          is_active: boolean
          material_id: number
          movement_type: number
          production_order_id: number | null
          quantity: number
          stock_type_id: number
          supplier_quotation_id: number | null
          supplier_service_id: number | null
          updated_by: string | null
          vinculated_movement_id: number | null
          warehouse_id: number
        }
        Insert: {
          completed: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          is_active?: boolean
          material_id: number
          movement_type: number
          production_order_id?: number | null
          quantity: number
          stock_type_id: number
          supplier_quotation_id?: number | null
          supplier_service_id?: number | null
          updated_by?: string | null
          vinculated_movement_id?: number | null
          warehouse_id: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          is_active?: boolean
          material_id?: number
          movement_type?: number
          production_order_id?: number | null
          quantity?: number
          stock_type_id?: number
          supplier_quotation_id?: number | null
          supplier_service_id?: number | null
          updated_by?: string | null
          vinculated_movement_id?: number | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "material_stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_movements_movement_type_fkey"
            columns: ["movement_type"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_movements_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_movements_stock_type_id_fkey"
            columns: ["stock_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_movements_supplier_quotation_id_fkey"
            columns: ["supplier_quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_service_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_movements_supplier_service_id_fkey"
            columns: ["supplier_service_id"]
            isOneToOne: false
            referencedRelation: "supplier_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_movements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "material_stock_movements_vinculated_movement_id_fkey"
            columns: ["vinculated_movement_id"]
            isOneToOne: false
            referencedRelation: "material_stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          created_by: string
          id: number
          images: string[]
          last_service_reference: number | null
          material_class_id: number
          measurement_unit_id: number
          name: string
          supplier_id: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: number
          images?: string[]
          last_service_reference?: number | null
          material_class_id: number
          measurement_unit_id: number
          name: string
          supplier_id?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          images?: string[]
          last_service_reference?: number | null
          material_class_id?: number
          measurement_unit_id?: number
          name?: string
          supplier_id?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "materials_last_service_reference_fkey"
            columns: ["last_service_reference"]
            isOneToOne: false
            referencedRelation: "supplier_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_material_class_id_fkey"
            columns: ["material_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_measurement_unit_id_fkey"
            columns: ["measurement_unit_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      minimun_stock_external_channels: {
        Row: {
          channel_id: number
          created_at: string
          created_by: string | null
          id: number
          is_active: boolean
          min_stock: number
          product_variation_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel_id: number
          created_at?: string
          created_by?: string | null
          id?: never
          is_active?: boolean
          min_stock?: number
          product_variation_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel_id?: number
          created_at?: string
          created_by?: string | null
          id?: never
          is_active?: boolean
          min_stock?: number
          product_variation_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minimun_stock_external_channels_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minimun_stock_external_channels_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      movement_invoices: {
        Row: {
          created_at: string
          id: number
          invoice_id: number
          movement_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          invoice_id: number
          movement_id: number
        }
        Update: {
          created_at?: string
          id?: number
          invoice_id?: number
          movement_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "movement_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_invoices_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          amount: number
          branch_id: number
          business_account_id: number
          code: string | null
          created_at: string
          description: string | null
          files_url: string[] | null
          id: number
          migracode: string | null
          movement_class_id: number
          movement_date: string
          movement_type_id: number
          payment_method_id: number
          user_id: string | null
        }
        Insert: {
          amount: number
          branch_id: number
          business_account_id: number
          code?: string | null
          created_at?: string
          description?: string | null
          files_url?: string[] | null
          id?: number
          migracode?: string | null
          movement_class_id: number
          movement_date: string
          movement_type_id: number
          payment_method_id: number
          user_id?: string | null
        }
        Update: {
          amount?: number
          branch_id?: number
          business_account_id?: number
          code?: string | null
          created_at?: string
          description?: string | null
          files_url?: string[] | null
          id?: number
          migracode?: string | null
          movement_class_id?: number
          movement_date?: string
          movement_type_id?: number
          payment_method_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_movement_class_id_fkey"
            columns: ["movement_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_movement_type_id_fkey"
            columns: ["movement_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city_id: number
          country_id: number
          created_at: string
          geo_map: string | null
          id: number
          name: string
          state_id: number
        }
        Insert: {
          city_id: number
          country_id: number
          created_at?: string
          geo_map?: string | null
          id?: number
          name: string
          state_id: number
        }
        Update: {
          city_id?: number
          country_id?: number
          created_at?: string
          geo_map?: string | null
          id?: number
          name?: string
          state_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "t_neighborhoods_country_id_state_id_city_id_fkey"
            columns: ["country_id", "state_id", "city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["country_id", "state_id", "id"]
          },
        ]
      }
      new_pos_order: {
        Row: {
          amount_paid: number | null
          amount_total: number | null
          customer_name: string | null
          date: string | null
          location_id: number | null
          movimiento_comprobante: number | null
          note: string | null
          partner_id: number | null
          payment_gateway_id_odoo: number | null
          payment_gateway_name_odoo: string | null
          price_list_odoo: number | null
          sale_id: number | null
          sale_id_name: string | null
          status: string | null
          to_invoice: boolean | null
          user_id: number | null
          vat: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_total?: number | null
          customer_name?: string | null
          date?: string | null
          location_id?: number | null
          movimiento_comprobante?: number | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number | null
          sale_id_name?: string | null
          status?: string | null
          to_invoice?: boolean | null
          user_id?: number | null
          vat?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_total?: number | null
          customer_name?: string | null
          date?: string | null
          location_id?: number | null
          movimiento_comprobante?: number | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number | null
          sale_id_name?: string | null
          status?: string | null
          to_invoice?: boolean | null
          user_id?: number | null
          vat?: string | null
        }
        Relationships: []
      }
      new_products_general_sales_odoo: {
        Row: {
          is_delivery: boolean | null
          order_id: number | null
          order_name: string | null
          price_total: number | null
          price_unit: number | null
          product_id: number | null
          product_line_id: number | null
          product_name: string | null
          product_uom_qty: number | null
          sale_id: number | null
        }
        Insert: {
          is_delivery?: boolean | null
          order_id?: number | null
          order_name?: string | null
          price_total?: number | null
          price_unit?: number | null
          product_id?: number | null
          product_line_id?: number | null
          product_name?: string | null
          product_uom_qty?: number | null
          sale_id?: number | null
        }
        Update: {
          is_delivery?: boolean | null
          order_id?: number | null
          order_name?: string | null
          price_total?: number | null
          price_unit?: number | null
          product_id?: number | null
          product_line_id?: number | null
          product_name?: string | null
          product_uom_qty?: number | null
          sale_id?: number | null
        }
        Relationships: []
      }
      new_sale_order: {
        Row: {
          amount_total: number | null
          branch_id_odoo: number | null
          branch_name_odoo: string | null
          customer_name: string | null
          date: string | null
          invoice_status: string | null
          note: string | null
          partner_id: number | null
          payment_gateway_id: number | null
          payment_gateway_id_odoo: number | null
          payment_gateway_name_odoo: string | null
          price_list_odoo: number | null
          sale_id: number | null
          sale_id_name: string | null
          sale_type_id_odoo: number | null
          sale_type_name: string | null
          status: string | null
          user_id: number | null
          vat: string | null
          warehouse_id_odoo: number | null
          woo_order_id: string | null
          woo_status: string | null
        }
        Insert: {
          amount_total?: number | null
          branch_id_odoo?: number | null
          branch_name_odoo?: string | null
          customer_name?: string | null
          date?: string | null
          invoice_status?: string | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number | null
          sale_id_name?: string | null
          sale_type_id_odoo?: number | null
          sale_type_name?: string | null
          status?: string | null
          user_id?: number | null
          vat?: string | null
          warehouse_id_odoo?: number | null
          woo_order_id?: string | null
          woo_status?: string | null
        }
        Update: {
          amount_total?: number | null
          branch_id_odoo?: number | null
          branch_name_odoo?: string | null
          customer_name?: string | null
          date?: string | null
          invoice_status?: string | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number | null
          sale_id_name?: string | null
          sale_type_id_odoo?: number | null
          sale_type_name?: string | null
          status?: string | null
          user_id?: number | null
          vat?: string | null
          warehouse_id_odoo?: number | null
          woo_order_id?: string | null
          woo_status?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          code: string | null
          created_at: string
          id: number
          image_url: string | null
          message: string | null
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          message?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          message?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      notification_reads: {
        Row: {
          notification_id: number
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: number
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: number
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          id: number
          message: string | null
          module_id: number | null
          permission_codes: string[]
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: number
          message?: string | null
          module_id?: number | null
          permission_codes: string[]
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: number
          message?: string | null
          module_id?: number | null
          permission_codes?: string[]
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      odoo_users: {
        Row: {
          id: number | null
          name: string | null
          vat: string | null
        }
        Insert: {
          id?: number | null
          name?: string | null
          vat?: string | null
        }
        Update: {
          id?: number | null
          name?: string | null
          vat?: string | null
        }
        Relationships: []
      }
      order_discounts: {
        Row: {
          code: string | null
          created_at: string
          discount_amount: number | null
          id: number
          name: string | null
          note: string | null
          order_id: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: number
          name?: string | null
          note?: string | null
          order_id: number
        }
        Update: {
          code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: number
          name?: string | null
          note?: string | null
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_discounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_discounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_discounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_invoices: {
        Row: {
          created_at: string
          id: number
          invoice_id: number
          order_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          invoice_id: number
          order_id: number
        }
        Update: {
          created_at?: string
          id?: number
          invoice_id?: number
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          id: number
          note_id: number
          order_id: number
        }
        Insert: {
          id?: number
          note_id: number
          order_id: number
        }
        Update: {
          id?: number
          note_id?: number
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "oder_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oder_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oder_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "oder_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment: {
        Row: {
          amount: number
          business_acount_id: number
          completed: boolean
          date: string
          gateway_confirmation_code: string | null
          id: number
          movement_id: number | null
          order_id: number
          payment_method_id: number
          updated_by: string | null
          voucher_url: string[] | null
        }
        Insert: {
          amount: number
          business_acount_id: number
          completed?: boolean
          date: string
          gateway_confirmation_code?: string | null
          id?: number
          movement_id?: number | null
          order_id: number
          payment_method_id: number
          updated_by?: string | null
          voucher_url?: string[] | null
        }
        Update: {
          amount?: number
          business_acount_id?: number
          completed?: boolean
          date?: string
          gateway_confirmation_code?: string | null
          id?: number
          movement_id?: number | null
          order_id?: number
          payment_method_id?: number
          updated_by?: string | null
          voucher_url?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_payment_payment_method_id_payment_methods_id"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_business_acount_id_fkey"
            columns: ["business_acount_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      order_product_franchise_sales: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number
          franchise_order_id: string | null
          id: number
          note: Json | null
          order_discount_id: number | null
          order_id: number
          order_product_id: number
          price_rule_id: number | null
          product_variation_id: number
          quantity: number
          sale_date: string
          source: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          franchise_order_id?: string | null
          id?: number
          note?: Json | null
          order_discount_id?: number | null
          order_id: number
          order_product_id: number
          price_rule_id?: number | null
          product_variation_id: number
          quantity: number
          sale_date?: string
          source?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          franchise_order_id?: string | null
          id?: number
          note?: Json | null
          order_discount_id?: number | null
          order_id?: number
          order_product_id?: number
          price_rule_id?: number | null
          product_variation_id?: number
          quantity?: number
          sale_date?: string
          source?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_product_franchise_sales_order_discount_id_fkey"
            columns: ["order_discount_id"]
            isOneToOne: false
            referencedRelation: "order_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_franchise_sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_franchise_sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_product_franchise_sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_franchise_sales_order_product_id_fkey"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_franchise_sales_order_product_id_fkey"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_franchise_sales_price_rule_id_fkey"
            columns: ["price_rule_id"]
            isOneToOne: false
            referencedRelation: "price_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_franchise_sales_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_product_quantity_adjustments: {
        Row: {
          adjusted_quantity: number | null
          created_at: string
          delta: number | null
          id: number
          note: string | null
          order_id: number
          order_product_id: number
          pending_request_id: number
          received_quantity: number
          resolved_at: string | null
          resolved_by: string | null
          sent_quantity: number
          sku: string
          status: string
          stock_movement_id: number | null
          tenant_reference: string | null
        }
        Insert: {
          adjusted_quantity?: number | null
          created_at?: string
          delta?: number | null
          id?: never
          note?: string | null
          order_id: number
          order_product_id: number
          pending_request_id: number
          received_quantity: number
          resolved_at?: string | null
          resolved_by?: string | null
          sent_quantity: number
          sku: string
          status?: string
          stock_movement_id?: number | null
          tenant_reference?: string | null
        }
        Update: {
          adjusted_quantity?: number | null
          created_at?: string
          delta?: number | null
          id?: never
          note?: string | null
          order_id?: number
          order_product_id?: number
          pending_request_id?: number
          received_quantity?: number
          resolved_at?: string | null
          resolved_by?: string | null
          sent_quantity?: number
          sku?: string
          status?: string
          stock_movement_id?: number | null
          tenant_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_product_quantity_adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_quantity_adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_product_quantity_adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_quantity_adjustments_order_product_id_fkey"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_quantity_adjustments_order_product_id_fkey"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_quantity_adjustments_pending_request_id_fkey"
            columns: ["pending_request_id"]
            isOneToOne: false
            referencedRelation: "pending_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_product_quantity_adjustments_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      order_products: {
        Row: {
          franchise_order_code: string[] | null
          id: number
          migracode: string | null
          order_id: number
          paid_by_franchise: number | null
          product_discount: number
          product_name: string | null
          product_price: number
          product_variation_id: number
          quantity: number
          received_by_franchise: number | null
          sold_by_franchise: number | null
          stock_movement_id: number
          unit_cost: number | null
          warehouses_id: number
        }
        Insert: {
          franchise_order_code?: string[] | null
          id?: number
          migracode?: string | null
          order_id: number
          paid_by_franchise?: number | null
          product_discount?: number
          product_name?: string | null
          product_price: number
          product_variation_id: number
          quantity: number
          received_by_franchise?: number | null
          sold_by_franchise?: number | null
          stock_movement_id?: number
          unit_cost?: number | null
          warehouses_id?: number
        }
        Update: {
          franchise_order_code?: string[] | null
          id?: number
          migracode?: string | null
          order_id?: number
          paid_by_franchise?: number | null
          product_discount?: number
          product_name?: string | null
          product_price?: number
          product_variation_id?: number
          quantity?: number
          received_by_franchise?: number | null
          sold_by_franchise?: number | null
          stock_movement_id?: number
          unit_cost?: number | null
          warehouses_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_products_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_products_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "fk_order_products_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_products_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_warehouses_id_fkey"
            columns: ["warehouses_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_situations: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          last_row: boolean
          order_id: number
          situation_id: number
          status_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          last_row: boolean
          order_id: number
          situation_id: number
          status_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          last_row?: boolean
          order_id?: number
          situation_id?: number
          status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_situations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "order_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_situations_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          address_reference: string | null
          branch_id: number | null
          change: number
          city_id: number | null
          consignament: boolean | null
          country_id: number | null
          created_at: string
          created_by: string | null
          customer_lastname: string | null
          customer_name: string | null
          date: string | null
          discount: number
          document_number: string
          document_type: number
          email: string | null
          id: number
          migracode: string | null
          neighborhood_id: number | null
          phone: string | null
          phone_whatsapp: string | null
          price_list_code: string
          reception_person: string | null
          reception_phone: string | null
          sale_type_id: number
          sended_to_franchise_at: string | null
          sended_to_franchise_by: string | null
          shipping_cost: number | null
          shipping_method_code: string | null
          shipping_method_id: number | null
          state_id: number | null
          subtotal: number
          success_viewed: boolean | null
          total: number
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_reference?: string | null
          branch_id?: number | null
          change?: number
          city_id?: number | null
          consignament?: boolean | null
          country_id?: number | null
          created_at?: string
          created_by?: string | null
          customer_lastname?: string | null
          customer_name?: string | null
          date?: string | null
          discount?: number
          document_number: string
          document_type: number
          email?: string | null
          id?: number
          migracode?: string | null
          neighborhood_id?: number | null
          phone?: string | null
          phone_whatsapp?: string | null
          price_list_code?: string
          reception_person?: string | null
          reception_phone?: string | null
          sale_type_id: number
          sended_to_franchise_at?: string | null
          sended_to_franchise_by?: string | null
          shipping_cost?: number | null
          shipping_method_code?: string | null
          shipping_method_id?: number | null
          state_id?: number | null
          subtotal: number
          success_viewed?: boolean | null
          total: number
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_reference?: string | null
          branch_id?: number | null
          change?: number
          city_id?: number | null
          consignament?: boolean | null
          country_id?: number | null
          created_at?: string
          created_by?: string | null
          customer_lastname?: string | null
          customer_name?: string | null
          date?: string | null
          discount?: number
          document_number?: string
          document_type?: number
          email?: string | null
          id?: number
          migracode?: string | null
          neighborhood_id?: number | null
          phone?: string | null
          phone_whatsapp?: string | null
          price_list_code?: string
          reception_person?: string | null
          reception_phone?: string | null
          sale_type_id?: number
          sended_to_franchise_at?: string | null
          sended_to_franchise_by?: string | null
          shipping_cost?: number | null
          shipping_method_code?: string | null
          shipping_method_id?: number | null
          state_id?: number | null
          subtotal?: number
          success_viewed?: boolean | null
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "orders_document_type_fkey"
            columns: ["document_type"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_neighborhood_id_city_id_state_id_country_id_fkey"
            columns: ["neighborhood_id", "city_id", "state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id", "city_id", "state_id", "country_id"]
          },
          {
            foreignKeyName: "orders_sale_type_id_fkey"
            columns: ["sale_type_id"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sended_to_franchise_by_fkey"
            columns: ["sended_to_franchise_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      parameters: {
        Row: {
          created_at: string
          id: number
          name: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          value: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          value?: string
        }
        Relationships: []
      }
      paremeters: {
        Row: {
          code: string | null
          id: number
          name: string
          value: string
        }
        Insert: {
          code?: string | null
          id?: number
          name: string
          value: string
        }
        Update: {
          code?: string | null
          id?: number
          name?: string
          value?: string
        }
        Relationships: []
      }
      payment_method_sale_type: {
        Row: {
          id: number
          payment_method_id: number
          sale_type_id: number
        }
        Insert: {
          id?: number
          payment_method_id: number
          sale_type_id: number
        }
        Update: {
          id?: number
          payment_method_id?: number
          sale_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_sale_type_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_method_sale_type_sale_type_id_fkey"
            columns: ["sale_type_id"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          business_account_id: number | null
          code: string | null
          description: string | null
          franchise: boolean
          id: number
          image_url: string | null
          is_active: boolean
          name: string
          time_to_cancel: number | null
        }
        Insert: {
          active: boolean
          business_account_id?: number | null
          code?: string | null
          description?: string | null
          franchise?: boolean
          id?: number
          image_url?: string | null
          is_active?: boolean
          name: string
          time_to_cancel?: number | null
        }
        Update: {
          active?: boolean
          business_account_id?: number | null
          code?: string | null
          description?: string | null
          franchise?: boolean
          id?: number
          image_url?: string | null
          is_active?: boolean
          name?: string
          time_to_cancel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_requests: {
        Row: {
          created_at: string
          from_fn: string
          id: number
          payload: Json
          processed_at: string | null
          processed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          from_fn: string
          id?: never
          payload: Json
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          from_fn?: string
          id?: never
          payload?: Json
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          active: boolean
          code: string
          id: number
          name: string
          parent_id: number | null
          type: Database["public"]["Enums"]["permission_type_enum"]
        }
        Insert: {
          active?: boolean
          code: string
          id?: never
          name: string
          parent_id?: number | null
          type: Database["public"]["Enums"]["permission_type_enum"]
        }
        Update: {
          active?: boolean
          code?: string
          id?: never
          name?: string
          parent_id?: number | null
          type?: Database["public"]["Enums"]["permission_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_permissions_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_order: {
        Row: {
          amount_paid: number | null
          amount_total: number | null
          customer_name: string | null
          date: string | null
          location_id: number | null
          movimiento_comprobante: number | null
          name: string | null
          note: string | null
          partner_id: number | null
          payment_gateway_id_odoo: number | null
          payment_gateway_name_odoo: string | null
          price_list_odoo: number | null
          sale_id: number
          sale_id_name: string
          status: string | null
          to_invoice: boolean | null
          user_id: number | null
          vat: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_total?: number | null
          customer_name?: string | null
          date?: string | null
          location_id?: number | null
          movimiento_comprobante?: number | null
          name?: string | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number
          sale_id_name: string
          status?: string | null
          to_invoice?: boolean | null
          user_id?: number | null
          vat?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_total?: number | null
          customer_name?: string | null
          date?: string | null
          location_id?: number | null
          movimiento_comprobante?: number | null
          name?: string | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number
          sale_id_name?: string
          status?: string | null
          to_invoice?: boolean | null
          user_id?: number | null
          vat?: string | null
        }
        Relationships: []
      }
      pos_session_orders: {
        Row: {
          created_at: string
          id: number
          order_id: number
          pos_session_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          order_id: number
          pos_session_id: number
        }
        Update: {
          created_at?: string
          id?: number
          order_id?: number
          pos_session_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_session_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_session_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "pos_session_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_session_orders_pos_session_id_fkey"
            columns: ["pos_session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          branch_id: number
          business_account: number
          closed_at: string | null
          "closing_amount number": number | null
          created_at: string
          difference: number | null
          expected_amount: number | null
          id: number
          notes: string | null
          opened_at: string
          opening_amount: number
          opening_difference: number
          sale_type_id: number
          status_id: number
          total_cash_sales: number
          total_sales: number | null
          user_id: string
          warehouse_id: number
        }
        Insert: {
          branch_id: number
          business_account: number
          closed_at?: string | null
          "closing_amount number"?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: number
          notes?: string | null
          opened_at?: string
          opening_amount: number
          opening_difference?: number
          sale_type_id?: number
          status_id: number
          total_cash_sales?: number
          total_sales?: number | null
          user_id?: string
          warehouse_id: number
        }
        Update: {
          branch_id?: number
          business_account?: number
          closed_at?: string | null
          "closing_amount number"?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: number
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          opening_difference?: number
          sale_type_id?: number
          status_id?: number
          total_cash_sales?: number
          total_sales?: number | null
          user_id?: string
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_business_account_fkey"
            columns: ["business_account"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_sale_type_id_fkey"
            columns: ["sale_type_id"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "pos_sessions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list: {
        Row: {
          code: string | null
          created_at: string | null
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      price_rules: {
        Row: {
          actions: Json
          code: string | null
          conditions: Json
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          exclusions: Json | null
          id: number
          is_active: boolean
          is_stackable: boolean
          landing_url: string | null
          name: string
          price_list_id: number | null
          priority: number
          rule_type: string
          stop_processing: boolean
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          actions?: Json
          code?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          exclusions?: Json | null
          id?: number
          is_active?: boolean
          is_stackable?: boolean
          landing_url?: string | null
          name: string
          price_list_id?: number | null
          priority: number
          rule_type: string
          stop_processing?: boolean
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          actions?: Json
          code?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          exclusions?: Json | null
          id?: number
          is_active?: boolean
          is_stackable?: boolean
          landing_url?: string | null
          name?: string
          price_list_id?: number | null
          priority?: number
          rule_type?: string
          stop_processing?: boolean
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "price_rules_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
        ]
      }
      process_group: {
        Row: {
          code: string | null
          created_at: string
          id: number
          is_active: boolean
          name: string
          source_process_id: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          source_process_id?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          source_process_id?: number | null
        }
        Relationships: []
      }
      processes: {
        Row: {
          code: string | null
          created_at: string
          id: number
          is_active: boolean
          name: string
          parent_process_id: number | null
          process_group_id: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          parent_process_id?: number | null
          process_group_id?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          parent_process_id?: number | null
          process_group_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processes_parent_process_id_fkey"
            columns: ["parent_process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_process_group_id_fkey"
            columns: ["process_group_id"]
            isOneToOne: false
            referencedRelation: "process_group"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: number
          id: number
          product_id: number
        }
        Insert: {
          category_id: number
          id?: number
          product_id: number
        }
        Update: {
          category_id?: number
          id?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_categories_category_id_categories_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_categories_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_channels: {
        Row: {
          channel_id: number
          id: number
          product_id: number
        }
        Insert: {
          channel_id: number
          id?: number
          product_id: number
        }
        Update: {
          channel_id?: number
          id?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_channels_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_channels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: number
          image_order: number
          image_url: string
          product_id: number
        }
        Insert: {
          id?: number
          image_order?: number
          image_url: string
          product_id: number
        }
        Update: {
          id?: number
          image_order?: number
          image_url?: string
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_images_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_locations: {
        Row: {
          created_at: string
          created_by: string
          id: number
          location: string
          product_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          location: string
          product_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          location?: string
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "product_locations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price: {
        Row: {
          id: number
          price: number
          price_list_id: number
          product_variation_id: number
          sale_price: number | null
        }
        Insert: {
          id?: number
          price: number
          price_list_id: number
          product_variation_id: number
          sale_price?: number | null
        }
        Update: {
          id?: number
          price?: number
          price_list_id?: number
          product_variation_id?: number
          sale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_price_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pricelist_item: {
        Row: {
          active: boolean | null
          applied_on: string
          base: string
          base_pricelist_id: number | null
          categ_id: number | null
          company_id: number | null
          compute_price: string
          create_date: string | null
          create_uid: number | null
          currency_id: number | null
          date_end: string | null
          date_start: string | null
          discount_price: number | null
          fixed_price: number | null
          id: number
          min_quantity: number | null
          percent_price: number | null
          price_discount: number | null
          price_max_margin: number | null
          price_min_margin: number | null
          price_round: number | null
          price_surcharge: number | null
          pricelist_id: number
          product_id: number | null
          product_tmpl_id: number | null
          write_date: string | null
          write_uid: number | null
        }
        Insert: {
          active?: boolean | null
          applied_on: string
          base: string
          base_pricelist_id?: number | null
          categ_id?: number | null
          company_id?: number | null
          compute_price: string
          create_date?: string | null
          create_uid?: number | null
          currency_id?: number | null
          date_end?: string | null
          date_start?: string | null
          discount_price?: number | null
          fixed_price?: number | null
          id?: number
          min_quantity?: number | null
          percent_price?: number | null
          price_discount?: number | null
          price_max_margin?: number | null
          price_min_margin?: number | null
          price_round?: number | null
          price_surcharge?: number | null
          pricelist_id: number
          product_id?: number | null
          product_tmpl_id?: number | null
          write_date?: string | null
          write_uid?: number | null
        }
        Update: {
          active?: boolean | null
          applied_on?: string
          base?: string
          base_pricelist_id?: number | null
          categ_id?: number | null
          company_id?: number | null
          compute_price?: string
          create_date?: string | null
          create_uid?: number | null
          currency_id?: number | null
          date_end?: string | null
          date_start?: string | null
          discount_price?: number | null
          fixed_price?: number | null
          id?: number
          min_quantity?: number | null
          percent_price?: number | null
          price_discount?: number | null
          price_max_margin?: number | null
          price_min_margin?: number | null
          price_round?: number | null
          price_surcharge?: number | null
          pricelist_id?: number
          product_id?: number | null
          product_tmpl_id?: number | null
          write_date?: string | null
          write_uid?: number | null
        }
        Relationships: []
      }
      product_stock: {
        Row: {
          id: number
          product_variation_id: number
          stock: number
          stock_type_id: number
          warehouse_id: number
        }
        Insert: {
          id?: number
          product_variation_id: number
          stock: number
          stock_type_id?: number
          warehouse_id: number
        }
        Update: {
          id?: number
          product_variation_id?: number
          stock?: number
          stock_type_id?: number
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_stock_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_stock_warehouse_id_warehouses_id"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_stock_type_id_fkey"
            columns: ["stock_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string
          id: number
          product_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          product_id: number
          tag_id: number
        }
        Update: {
          created_at?: string
          id?: number
          product_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_template: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string | null
          description: string | null
          is_active: boolean | null
          is_variable: boolean | null
          product_template_id: number
          promotional_bg_color: string | null
          promotional_text: string | null
          short_description: string | null
          sizes_image_url: string | null
          title: string
          web: boolean | null
          woo_id: string | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          is_variable?: boolean | null
          product_template_id?: number
          promotional_bg_color?: string | null
          promotional_text?: string | null
          short_description?: string | null
          sizes_image_url?: string | null
          title: string
          web?: boolean | null
          woo_id?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          is_variable?: boolean | null
          product_template_id?: number
          promotional_bg_color?: string | null
          promotional_text?: string | null
          short_description?: string | null
          sizes_image_url?: string | null
          title?: string
          web?: boolean | null
          woo_id?: string | null
        }
        Relationships: []
      }
      product_terms_woo_min: {
        Row: {
          object_id: number | null
          term_order: number | null
          term_taxonomy_id: number | null
        }
        Insert: {
          object_id?: number | null
          term_order?: number | null
          term_taxonomy_id?: number | null
        }
        Update: {
          object_id?: number | null
          term_order?: number | null
          term_taxonomy_id?: number | null
        }
        Relationships: []
      }
      product_terms_woo_min_padres: {
        Row: {
          product_template_id: number | null
          woo_id: string | null
          woo_instance: number | null
        }
        Insert: {
          product_template_id?: number | null
          woo_id?: string | null
          woo_instance?: number | null
        }
        Update: {
          product_template_id?: number | null
          woo_id?: string | null
          woo_instance?: number | null
        }
        Relationships: []
      }
      product_variation_images: {
        Row: {
          id: number
          product_image_id: number
          product_variation_id: number
        }
        Insert: {
          id?: number
          product_image_id: number
          product_variation_id: number
        }
        Update: {
          id?: number
          product_image_id?: number
          product_variation_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_variation_images_product_image_id_product_images_"
            columns: ["product_image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_variation_images_product_variation_id_product_var"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_info: {
        Row: {
          created_at: string
          id: number
          order: number
          planned_end: string | null
          planned_start: string | null
          process_group_id: number | null
          process_id: number | null
          production_order_id: number
          supplier_service_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          order: number
          planned_end?: string | null
          planned_start?: string | null
          process_group_id?: number | null
          process_id?: number | null
          production_order_id: number
          supplier_service_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          order?: number
          planned_end?: string | null
          planned_start?: string | null
          process_group_id?: number | null
          process_id?: number | null
          production_order_id?: number
          supplier_service_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_info_process_group_id_fkey"
            columns: ["process_group_id"]
            isOneToOne: false
            referencedRelation: "process_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_info_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_info_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_info_supplier_service_id_fkey"
            columns: ["supplier_service_id"]
            isOneToOne: false
            referencedRelation: "supplier_services"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_item_info: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          production_order_info_id: number
          production_order_item_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          production_order_info_id: number
          production_order_item_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          production_order_info_id?: number
          production_order_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_order_item_info_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "production_order_item_info_info_id_fkey"
            columns: ["production_order_info_id"]
            isOneToOne: false
            referencedRelation: "production_order_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_item_info_item_id_fkey"
            columns: ["production_order_item_id"]
            isOneToOne: false
            referencedRelation: "production_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_item_materials: {
        Row: {
          created_at: string
          explosion_id: number | null
          id: number
          material_id: number
          production_order_item_id: number
          quantity: number | null
          unit_cost: number | null
          variation_id: number | null
        }
        Insert: {
          created_at?: string
          explosion_id?: number | null
          id?: number
          material_id: number
          production_order_item_id: number
          quantity?: number | null
          unit_cost?: number | null
          variation_id?: number | null
        }
        Update: {
          created_at?: string
          explosion_id?: number | null
          id?: number
          material_id?: number
          production_order_item_id?: number
          quantity?: number | null
          unit_cost?: number | null
          variation_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_item_materials_explosion_id_fkey"
            columns: ["explosion_id"]
            isOneToOne: false
            referencedRelation: "explosions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_item_materials_item_id_fkey"
            columns: ["production_order_item_id"]
            isOneToOne: false
            referencedRelation: "production_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_item_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_item_materials_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_items: {
        Row: {
          created_at: string
          explosion_id: number | null
          id: number
          intake_closed_at: string | null
          intake_closed_by: string | null
          production_id: number
          quantity: number
          variation_id: number | null
        }
        Insert: {
          created_at?: string
          explosion_id?: number | null
          id?: number
          intake_closed_at?: string | null
          intake_closed_by?: string | null
          production_id: number
          quantity: number
          variation_id?: number | null
        }
        Update: {
          created_at?: string
          explosion_id?: number | null
          id?: number
          intake_closed_at?: string | null
          intake_closed_by?: string | null
          production_id?: number
          quantity?: number
          variation_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_explosion_id_fkey"
            columns: ["explosion_id"]
            isOneToOne: false
            referencedRelation: "explosions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_intake_closed_by_fkey"
            columns: ["intake_closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "production_order_items_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          code: string | null
          created_at: string
          created_by: string
          description: string | null
          finish_date: string | null
          id: number
          name: string
          production_order_class_id: number
          promised_date: string | null
          quantity: number | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          finish_date?: string | null
          id?: number
          name: string
          production_order_class_id: number
          promised_date?: string | null
          quantity?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          finish_date?: string | null
          id?: number
          name?: string
          production_order_class_id?: number
          promised_date?: string | null
          quantity?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_class_id_fkey"
            columns: ["production_order_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "production_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          description: string | null
          exhibition_end_date: string | null
          exhibition_start_date: string | null
          id: number
          is_active: boolean | null
          is_variable: boolean
          migracodde: string | null
          other_description_may: string | null
          other_description_min: string | null
          promotional_bg_color: string | null
          promotional_img_url: string | null
          promotional_text: string | null
          promotional_text_color: string | null
          short_description: string
          sizes_image_url: string | null
          sizes_ref_image_url: string | null
          title: string
          web: boolean
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          exhibition_end_date?: string | null
          exhibition_start_date?: string | null
          id?: number
          is_active?: boolean | null
          is_variable: boolean
          migracodde?: string | null
          other_description_may?: string | null
          other_description_min?: string | null
          promotional_bg_color?: string | null
          promotional_img_url?: string | null
          promotional_text?: string | null
          promotional_text_color?: string | null
          short_description?: string
          sizes_image_url?: string | null
          sizes_ref_image_url?: string | null
          title: string
          web?: boolean
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          exhibition_end_date?: string | null
          exhibition_start_date?: string | null
          id?: number
          is_active?: boolean | null
          is_variable?: boolean
          migracodde?: string | null
          other_description_may?: string | null
          other_description_min?: string | null
          promotional_bg_color?: string | null
          promotional_img_url?: string | null
          promotional_text?: string | null
          promotional_text_color?: string | null
          short_description?: string
          sizes_image_url?: string | null
          sizes_ref_image_url?: string | null
          title?: string
          web?: boolean
        }
        Relationships: []
      }
      products_general_sales_odoo: {
        Row: {
          is_delivery: boolean | null
          order_id: number | null
          order_name: string | null
          price_total: number | null
          price_unit: number | null
          product_id: number
          product_line_id: number | null
          product_name: string | null
          product_uom_qty: number | null
          sale_id: number | null
        }
        Insert: {
          is_delivery?: boolean | null
          order_id?: number | null
          order_name?: string | null
          price_total?: number | null
          price_unit?: number | null
          product_id: number
          product_line_id?: number | null
          product_name?: string | null
          product_uom_qty?: number | null
          sale_id?: number | null
        }
        Update: {
          is_delivery?: boolean | null
          order_id?: number | null
          order_name?: string | null
          price_total?: number | null
          price_unit?: number | null
          product_id?: number
          product_line_id?: number | null
          product_name?: string | null
          product_uom_qty?: number | null
          sale_id?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: number
          address: string | null
          address_reference: string | null
          birthday_day: string | null
          branch_id: number
          city_id: number | null
          country_id: number | null
          created_at: string | null
          is_active: boolean
          las_account_id: number | null
          neighborhood_id: number | null
          phone: number | null
          phone_whatsapp: number | null
          state_id: number | null
          UID: string
          user_name: string
          warehouse_id: number
        }
        Insert: {
          account_id: number
          address?: string | null
          address_reference?: string | null
          birthday_day?: string | null
          branch_id: number
          city_id?: number | null
          country_id?: number | null
          created_at?: string | null
          is_active: boolean
          las_account_id?: number | null
          neighborhood_id?: number | null
          phone?: number | null
          phone_whatsapp?: number | null
          state_id?: number | null
          UID: string
          user_name: string
          warehouse_id?: number
        }
        Update: {
          account_id?: number
          address?: string | null
          address_reference?: string | null
          birthday_day?: string | null
          branch_id?: number
          city_id?: number | null
          country_id?: number | null
          created_at?: string | null
          is_active?: boolean
          las_account_id?: number | null
          neighborhood_id?: number | null
          phone?: number | null
          phone_whatsapp?: number | null
          state_id?: number | null
          UID?: string
          user_name?: string
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_city_id_state_id_country_id_fkey"
            columns: ["city_id", "state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id", "state_id", "country_id"]
          },
          {
            foreignKeyName: "users_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_neighborhood_id_city_id_state_id_country_id_fkey"
            columns: ["neighborhood_id", "city_id", "state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id", "city_id", "state_id", "country_id"]
          },
          {
            foreignKeyName: "users_state_id_country_id_fkey"
            columns: ["state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id", "country_id"]
          },
        ]
      }
      promotional_texts: {
        Row: {
          meta_id: number | null
          meta_key: string | null
          meta_value: string | null
          post_id: number | null
        }
        Insert: {
          meta_id?: number | null
          meta_key?: string | null
          meta_value?: string | null
          post_id?: number | null
        }
        Update: {
          meta_id?: number | null
          meta_key?: string | null
          meta_value?: string | null
          post_id?: number | null
        }
        Relationships: []
      }
      res_partner: {
        Row: {
          active: boolean | null
          additional_info: string | null
          barcode: string | null
          calendar_last_notif_ack: string | null
          city: string | null
          city_id: number | null
          color: number | null
          comment: string | null
          commercial_company_name: string | null
          commercial_partner_id: number | null
          company_id: number | null
          company_name: string | null
          country_id: number | null
          create_date: string | null
          create_uid: number | null
          credit_blocking: number | null
          credit_check: boolean | null
          credit_limit: number | null
          credit_warning: number | null
          customer_rank: number | null
          date: string | null
          debit_limit: number | null
          display_name: string | null
          district_id: number | null
          email: string | null
          email_normalized: string | null
          employee: boolean | null
          es_conductor: boolean | null
          es_empresa_transporte_publico: boolean | null
          estado_contribuyente: string | null
          function: string | null
          id: number
          industry_id: number | null
          invoice_warn: string | null
          invoice_warn_msg: string | null
          is_company: boolean | null
          is_woo_customer: boolean | null
          l10n_latam_identification_type_id: number | null
          l10n_pe_district: number | null
          lang: string | null
          last_time_entries_checked: string | null
          licencia: string | null
          message_bounce: number | null
          message_main_attachment_id: number | null
          mobile: string | null
          msg_error: string | null
          name: string | null
          parent_id: number | null
          partner_gid: number | null
          partner_latitude: number | null
          partner_longitude: number | null
          partner_share: boolean | null
          phone: string | null
          phone_sanitized: string | null
          picking_warn: string | null
          picking_warn_msg: string | null
          province_id: number | null
          provincia: string | null
          purchase_warn: string | null
          purchase_warn_msg: string | null
          ref: string | null
          registration_name: string | null
          role: string | null
          sale_warn: string | null
          sale_warn_msg: string | null
          signup_expiration: string | null
          signup_token: string | null
          signup_type: string | null
          state_id: number | null
          street: string | null
          street_name: string | null
          street_number: string | null
          street_number2: string | null
          street2: string | null
          supplier_rank: number | null
          team_id: number | null
          title: number | null
          type: string | null
          tz: string | null
          ubigeo: string | null
          user_id: number | null
          vat: string | null
          website: string | null
          write_date: string | null
          write_uid: number | null
          x_provincia: string | null
          zip: string | null
        }
        Insert: {
          active?: boolean | null
          additional_info?: string | null
          barcode?: string | null
          calendar_last_notif_ack?: string | null
          city?: string | null
          city_id?: number | null
          color?: number | null
          comment?: string | null
          commercial_company_name?: string | null
          commercial_partner_id?: number | null
          company_id?: number | null
          company_name?: string | null
          country_id?: number | null
          create_date?: string | null
          create_uid?: number | null
          credit_blocking?: number | null
          credit_check?: boolean | null
          credit_limit?: number | null
          credit_warning?: number | null
          customer_rank?: number | null
          date?: string | null
          debit_limit?: number | null
          display_name?: string | null
          district_id?: number | null
          email?: string | null
          email_normalized?: string | null
          employee?: boolean | null
          es_conductor?: boolean | null
          es_empresa_transporte_publico?: boolean | null
          estado_contribuyente?: string | null
          function?: string | null
          id?: number
          industry_id?: number | null
          invoice_warn?: string | null
          invoice_warn_msg?: string | null
          is_company?: boolean | null
          is_woo_customer?: boolean | null
          l10n_latam_identification_type_id?: number | null
          l10n_pe_district?: number | null
          lang?: string | null
          last_time_entries_checked?: string | null
          licencia?: string | null
          message_bounce?: number | null
          message_main_attachment_id?: number | null
          mobile?: string | null
          msg_error?: string | null
          name?: string | null
          parent_id?: number | null
          partner_gid?: number | null
          partner_latitude?: number | null
          partner_longitude?: number | null
          partner_share?: boolean | null
          phone?: string | null
          phone_sanitized?: string | null
          picking_warn?: string | null
          picking_warn_msg?: string | null
          province_id?: number | null
          provincia?: string | null
          purchase_warn?: string | null
          purchase_warn_msg?: string | null
          ref?: string | null
          registration_name?: string | null
          role?: string | null
          sale_warn?: string | null
          sale_warn_msg?: string | null
          signup_expiration?: string | null
          signup_token?: string | null
          signup_type?: string | null
          state_id?: number | null
          street?: string | null
          street_name?: string | null
          street_number?: string | null
          street_number2?: string | null
          street2?: string | null
          supplier_rank?: number | null
          team_id?: number | null
          title?: number | null
          type?: string | null
          tz?: string | null
          ubigeo?: string | null
          user_id?: number | null
          vat?: string | null
          website?: string | null
          write_date?: string | null
          write_uid?: number | null
          x_provincia?: string | null
          zip?: string | null
        }
        Update: {
          active?: boolean | null
          additional_info?: string | null
          barcode?: string | null
          calendar_last_notif_ack?: string | null
          city?: string | null
          city_id?: number | null
          color?: number | null
          comment?: string | null
          commercial_company_name?: string | null
          commercial_partner_id?: number | null
          company_id?: number | null
          company_name?: string | null
          country_id?: number | null
          create_date?: string | null
          create_uid?: number | null
          credit_blocking?: number | null
          credit_check?: boolean | null
          credit_limit?: number | null
          credit_warning?: number | null
          customer_rank?: number | null
          date?: string | null
          debit_limit?: number | null
          display_name?: string | null
          district_id?: number | null
          email?: string | null
          email_normalized?: string | null
          employee?: boolean | null
          es_conductor?: boolean | null
          es_empresa_transporte_publico?: boolean | null
          estado_contribuyente?: string | null
          function?: string | null
          id?: number
          industry_id?: number | null
          invoice_warn?: string | null
          invoice_warn_msg?: string | null
          is_company?: boolean | null
          is_woo_customer?: boolean | null
          l10n_latam_identification_type_id?: number | null
          l10n_pe_district?: number | null
          lang?: string | null
          last_time_entries_checked?: string | null
          licencia?: string | null
          message_bounce?: number | null
          message_main_attachment_id?: number | null
          mobile?: string | null
          msg_error?: string | null
          name?: string | null
          parent_id?: number | null
          partner_gid?: number | null
          partner_latitude?: number | null
          partner_longitude?: number | null
          partner_share?: boolean | null
          phone?: string | null
          phone_sanitized?: string | null
          picking_warn?: string | null
          picking_warn_msg?: string | null
          province_id?: number | null
          provincia?: string | null
          purchase_warn?: string | null
          purchase_warn_msg?: string | null
          ref?: string | null
          registration_name?: string | null
          role?: string | null
          sale_warn?: string | null
          sale_warn_msg?: string | null
          signup_expiration?: string | null
          signup_token?: string | null
          signup_type?: string | null
          state_id?: number | null
          street?: string | null
          street_name?: string | null
          street_number?: string | null
          street_number2?: string | null
          street2?: string | null
          supplier_rank?: number | null
          team_id?: number | null
          title?: number | null
          type?: string | null
          tz?: string | null
          ubigeo?: string | null
          user_id?: number | null
          vat?: string | null
          website?: string | null
          write_date?: string | null
          write_uid?: number | null
          x_provincia?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      return_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          id: number
          movement_id: number
          payment_date: string
          payment_method_id: number
          return_id: number
          voucher_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          id?: number
          movement_id: number
          payment_date?: string
          payment_method_id: number
          return_id: number
          voucher_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          id?: number
          movement_id?: number
          payment_date?: string
          payment_method_id?: number
          return_id?: number
          voucher_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "return_payments_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_payments_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_payments_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      return_situations: {
        Row: {
          created_at: string
          created_by: string
          id: number
          last_row: boolean
          module_id: number
          return_id: number
          situation_id: number
          status_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          last_row: boolean
          module_id: number
          return_id: number
          situation_id: number
          status_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          last_row?: boolean
          module_id?: number
          return_id?: number
          situation_id?: number
          status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "return_situations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "return_situations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_situations_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_situations_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_situations_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string | null
          created_by: string
          customer_document_number: string
          customer_document_type_id: number | null
          id: number
          module_id: number
          order_id: number
          order_situation_id: number | null
          reason: string | null
          return_id: number | null
          return_type_id: number
          shipping_return: boolean
          situation_id: number
          status_id: number
          total_order_amount: number | null
          total_refund_amount: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          customer_document_number: string
          customer_document_type_id?: number | null
          id?: never
          module_id: number
          order_id: number
          order_situation_id?: number | null
          reason?: string | null
          return_id?: number | null
          return_type_id: number
          shipping_return?: boolean
          situation_id: number
          status_id: number
          total_order_amount?: number | null
          total_refund_amount?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          customer_document_number?: string
          customer_document_type_id?: number | null
          id?: never
          module_id?: number
          order_id?: number
          order_situation_id?: number | null
          reason?: string | null
          return_id?: number | null
          return_type_id?: number
          shipping_return?: boolean
          situation_id?: number
          status_id?: number
          total_order_amount?: number | null
          total_refund_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "returns_customer_document_type_id_fkey"
            columns: ["customer_document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_situation_fkey"
            columns: ["order_situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_return_type_id_fkey"
            columns: ["return_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      returns_products: {
        Row: {
          created_at: string | null
          id: number
          order_product_id: number | null
          order_quantity: number | null
          output: boolean
          product_amount: number | null
          product_variation_id: number
          return_id: number
          return_quantity: number
          stock_movement_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          order_product_id?: number | null
          order_quantity?: number | null
          output?: boolean
          product_amount?: number | null
          product_variation_id: number
          return_id: number
          return_quantity: number
          stock_movement_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: never
          order_product_id?: number | null
          order_quantity?: number | null
          output?: boolean
          product_amount?: number | null
          product_variation_id?: number
          return_id?: number
          return_quantity?: number
          stock_movement_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_products_order_product_id_fkey"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "order_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_products_order_product_id_fkey"
            columns: ["order_product_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_products_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_products_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_products_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_products_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      role_capabilities: {
        Row: {
          capability_id: number
          id: number
          role_id: number
        }
        Insert: {
          capability_id: number
          id?: number
          role_id: number
        }
        Update: {
          capability_id?: number
          id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_capabilities_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_capabilities_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_functions: {
        Row: {
          function_id: number
          id: number
          role_id: number
        }
        Insert: {
          function_id: number
          id?: number
          role_id: number
        }
        Update: {
          function_id?: number
          id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_role_functions_function_id_functions_id"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_role_functions_role_id_roles_id"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: number
          permission_id: number
          role_id: number
        }
        Insert: {
          id?: never
          permission_id: number
          role_id: number
        }
        Update: {
          id?: never
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_role_permissions_permission"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_role_permissions_role"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          admin: boolean
          created_at: string
          id: number
          name: string
        }
        Insert: {
          admin?: boolean
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          admin?: boolean
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      sale_order: {
        Row: {
          amount_total: number | null
          branch_id_odoo: number | null
          branch_name_odoo: string | null
          customer_name: string | null
          date: string | null
          invoice_status: string | null
          note: string | null
          partner_id: number | null
          payment_gateway_id: number | null
          payment_gateway_id_odoo: number | null
          payment_gateway_name_odoo: string | null
          price_list_odoo: number | null
          sale_id: number
          sale_id_name: string | null
          sale_type_id_odoo: number | null
          sale_type_name: string | null
          status: string | null
          user_id: number | null
          vat: string | null
          warehouse_id_odoo: number | null
          woo_order_id: string | null
          woo_status: string | null
        }
        Insert: {
          amount_total?: number | null
          branch_id_odoo?: number | null
          branch_name_odoo?: string | null
          customer_name?: string | null
          date?: string | null
          invoice_status?: string | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number
          sale_id_name?: string | null
          sale_type_id_odoo?: number | null
          sale_type_name?: string | null
          status?: string | null
          user_id?: number | null
          vat?: string | null
          warehouse_id_odoo?: number | null
          woo_order_id?: string | null
          woo_status?: string | null
        }
        Update: {
          amount_total?: number | null
          branch_id_odoo?: number | null
          branch_name_odoo?: string | null
          customer_name?: string | null
          date?: string | null
          invoice_status?: string | null
          note?: string | null
          partner_id?: number | null
          payment_gateway_id?: number | null
          payment_gateway_id_odoo?: number | null
          payment_gateway_name_odoo?: string | null
          price_list_odoo?: number | null
          sale_id?: number
          sale_id_name?: string | null
          sale_type_id_odoo?: number | null
          sale_type_name?: string | null
          status?: string | null
          user_id?: number | null
          vat?: string | null
          warehouse_id_odoo?: number | null
          woo_order_id?: string | null
          woo_status?: string | null
        }
        Relationships: []
      }
      sale_type_branches: {
        Row: {
          branch_id: number
          id: number
          sale_type_id: number
        }
        Insert: {
          branch_id: number
          id?: number
          sale_type_id: number
        }
        Update: {
          branch_id?: number
          id?: number
          sale_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_type_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_type_warehouses_sale_type_id_fkey"
            columns: ["sale_type_id"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_types: {
        Row: {
          boleta_serie_id: number
          business_acount_id: number | null
          code: string | null
          created_at: string
          factura_serie_id: number
          guia_remitente_serie_id: number | null
          id: number
          is_active: boolean
          name: string
          pos_sale_type: boolean
        }
        Insert: {
          boleta_serie_id: number
          business_acount_id?: number | null
          code?: string | null
          created_at?: string
          factura_serie_id: number
          guia_remitente_serie_id?: number | null
          id?: number
          is_active?: boolean
          name: string
          pos_sale_type?: boolean
        }
        Update: {
          boleta_serie_id?: number
          business_acount_id?: number | null
          code?: string | null
          created_at?: string
          factura_serie_id?: number
          guia_remitente_serie_id?: number | null
          id?: number
          is_active?: boolean
          name?: string
          pos_sale_type?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sale_types_boleta_serie_id_fkey"
            columns: ["boleta_serie_id"]
            isOneToOne: false
            referencedRelation: "invoice_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_types_business_acount_id_fkey"
            columns: ["business_acount_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_types_factura_serie_id_fkey"
            columns: ["factura_serie_id"]
            isOneToOne: false
            referencedRelation: "invoice_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_types_guia_remitente_serie_id_fkey"
            columns: ["guia_remitente_serie_id"]
            isOneToOne: false
            referencedRelation: "invoice_series"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          name: string
        }
        Insert: {
          applied_at?: string | null
          name: string
        }
        Update: {
          applied_at?: string | null
          name?: string
        }
        Relationships: []
      }
      shipping_costs: {
        Row: {
          city_id: number | null
          cost: number
          country_id: number | null
          created_at: string
          id: number
          name: string
          neighborhood_id: number | null
          shipping_method_id: number
          state_id: number | null
        }
        Insert: {
          city_id?: number | null
          cost: number
          country_id?: number | null
          created_at?: string
          id?: number
          name: string
          neighborhood_id?: number | null
          shipping_method_id: number
          state_id?: number | null
        }
        Update: {
          city_id?: number | null
          cost?: number
          country_id?: number | null
          created_at?: string
          id?: number
          name?: string
          neighborhood_id?: number | null
          shipping_method_id?: number
          state_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_costs_city_id_state_id_country_id_fkey"
            columns: ["city_id", "state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id", "state_id", "country_id"]
          },
          {
            foreignKeyName: "shipping_costs_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_costs_neighborhood_id_city_id_state_id_country_id_fkey"
            columns: ["neighborhood_id", "city_id", "state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id", "city_id", "state_id", "country_id"]
          },
          {
            foreignKeyName: "shipping_costs_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_costs_state_id_country_id_fkey"
            columns: ["state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id", "country_id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          code: string | null
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      situations: {
        Row: {
          code: string | null
          created_at: string
          id: number
          module_id: number
          name: string
          order: number | null
          status_id: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          module_id: number
          name: string
          order?: number | null
          status_id: number
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          module_id?: number
          name?: string
          order?: number | null
          status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "situations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situations_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          country_id: number
          created_at: string
          geo_map: string | null
          id: number
          name: string
        }
        Insert: {
          country_id: number
          created_at?: string
          geo_map?: string | null
          id?: number
          name: string
        }
        Update: {
          country_id?: number
          created_at?: string
          geo_map?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "t_states_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          code: string
          created_at: string
          id: number
          module_id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          module_id: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          module_id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "statuses_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entries: {
        Row: {
          code: string | null
          created_at: string
          created_by: string
          id: number
          name: string | null
          production_order_id: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by: string
          id?: number
          name?: string | null
          production_order_id?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string
          id?: number
          name?: string | null
          production_order_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "stock_entries_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movement_request_situations: {
        Row: {
          created_at: string
          created_by: string
          id: number
          last_row: boolean
          message: string | null
          module_id: number
          notes: string | null
          situation_id: number
          status_id: number
          stock_movement_request_id: number
          warehouse_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          last_row?: boolean
          message?: string | null
          module_id: number
          notes?: string | null
          situation_id: number
          status_id: number
          stock_movement_request_id: number
          warehouse_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          last_row?: boolean
          message?: string | null
          module_id?: number
          notes?: string | null
          situation_id?: number
          status_id?: number
          stock_movement_request_id?: number
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movement_request_situation_stock_movement_request_id_fkey"
            columns: ["stock_movement_request_id"]
            isOneToOne: false
            referencedRelation: "stock_movement_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_request_situations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_request_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_request_situations_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_request_situations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movement_requests: {
        Row: {
          created_at: string
          created_by: string
          id: number
          in_warehouse_id: number | null
          out_warehouse_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          in_warehouse_id?: number | null
          out_warehouse_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          in_warehouse_id?: number | null
          out_warehouse_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movement_requests_in_warehouse_id_fkey"
            columns: ["in_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_requests_out_warehouse_id_fkey"
            columns: ["out_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          completed: boolean
          created_at: string | null
          created_by: string | null
          id: number
          is_active: boolean
          migracode: string | null
          movement_type: number
          product_variation_id: number
          quantity: number
          stock_type_id: number | null
          vinculated_movement_id: number | null
          warehouse_id: number
        }
        Insert: {
          completed: boolean
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_active?: boolean
          migracode?: string | null
          movement_type: number
          product_variation_id: number
          quantity: number
          stock_type_id?: number | null
          vinculated_movement_id?: number | null
          warehouse_id: number
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_active?: boolean
          migracode?: string | null
          movement_type?: number
          product_variation_id?: number
          quantity?: number
          stock_type_id?: number | null
          vinculated_movement_id?: number | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "stock_movements_movement_type_fkey"
            columns: ["movement_type"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_stock_type_id_fkey"
            columns: ["stock_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_vinculated_movement_id_fkey"
            columns: ["vinculated_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_quant: {
        Row: {
          company_id: number | null
          create_date: string | null
          create_uid: number | null
          id: number
          in_date: string | null
          location_id: number
          lot_id: number | null
          owner_id: number | null
          package_id: number | null
          product_id: number
          quantity: number | null
          reserved_quantity: number
          write_date: string | null
          write_uid: number | null
        }
        Insert: {
          company_id?: number | null
          create_date?: string | null
          create_uid?: number | null
          id?: number
          in_date?: string | null
          location_id: number
          lot_id?: number | null
          owner_id?: number | null
          package_id?: number | null
          product_id: number
          quantity?: number | null
          reserved_quantity: number
          write_date?: string | null
          write_uid?: number | null
        }
        Update: {
          company_id?: number | null
          create_date?: string | null
          create_uid?: number | null
          id?: number
          in_date?: string | null
          location_id?: number
          lot_id?: number | null
          owner_id?: number | null
          package_id?: number | null
          product_id?: number
          quantity?: number | null
          reserved_quantity?: number
          write_date?: string | null
          write_uid?: number | null
        }
        Relationships: []
      }
      subscription_permissions: {
        Row: {
          created_at: string
          id: number
          permission_id: number
          subscription_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          permission_id: number
          subscription_id: number
        }
        Update: {
          created_at?: string
          id?: number
          permission_id?: number
          subscription_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_permissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: number
          name: string
          number: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: number
          name: string
          number?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: number
          name?: string
          number?: number
        }
        Relationships: []
      }
      supplier_classes: {
        Row: {
          created_at: string
          id: number
          supplier_class_id: number
          supplier_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          supplier_class_id: number
          supplier_id: number
        }
        Update: {
          created_at?: string
          id?: number
          supplier_class_id?: number
          supplier_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_classes_supplier_class_id_fkey"
            columns: ["supplier_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_types_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotation_consumptions: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          material_id: number
          supplier_quotation_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          material_id: number
          supplier_quotation_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          material_id?: number
          supplier_quotation_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotation_consumptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "supplier_quotation_consumptions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotation_consumptions_supplier_quotation_id_fkey"
            columns: ["supplier_quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_service_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotations_payments: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: number
          movement_id: number
          payment_method_id: number
          supplier_quotation_id: number
          supplier_service_id: number | null
          voucher_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          date?: string
          id?: number
          movement_id: number
          payment_method_id: number
          supplier_quotation_id: number
          supplier_service_id?: number | null
          voucher_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: number
          movement_id?: number
          payment_method_id?: number
          supplier_quotation_id?: number
          supplier_service_id?: number | null
          voucher_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotations_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "supplier_quotations_payments_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotations_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotations_payments_supplier_quotation_id_fkey"
            columns: ["supplier_quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_service_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotations_payments_supplier_service_id_fkey"
            columns: ["supplier_service_id"]
            isOneToOne: false
            referencedRelation: "supplier_services"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_service_quotations: {
        Row: {
          code: string | null
          created_at: string
          created_by: string
          currency: string
          digital_files: string[] | null
          id: number
          payment_terms: string | null
          price: number | null
          quantity: number | null
          request_description: string | null
          subject: string
          supplier_id: number
          warehouse_id: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          digital_files?: string[] | null
          id?: number
          payment_terms?: string | null
          price?: number | null
          quantity?: number | null
          request_description?: string | null
          subject: string
          supplier_id: number
          warehouse_id?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          digital_files?: string[] | null
          id?: number
          payment_terms?: string | null
          price?: number | null
          quantity?: number | null
          request_description?: string | null
          subject?: string
          supplier_id?: number
          warehouse_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "supplier_quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_service_quotations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_service_situations: {
        Row: {
          bad_quantity: number | null
          created_at: string
          created_by: string
          id: number
          last_row: boolean
          measurement_unit: string
          message: string | null
          module_id: number
          price: number | null
          quantity: number | null
          situation_id: number
          status_id: number
          supplier_service_id: number
        }
        Insert: {
          bad_quantity?: number | null
          created_at?: string
          created_by?: string
          id?: number
          last_row: boolean
          measurement_unit: string
          message?: string | null
          module_id: number
          price?: number | null
          quantity?: number | null
          situation_id: number
          status_id: number
          supplier_service_id: number
        }
        Update: {
          bad_quantity?: number | null
          created_at?: string
          created_by?: string
          id?: number
          last_row?: boolean
          measurement_unit?: string
          message?: string | null
          module_id?: number
          price?: number | null
          quantity?: number | null
          situation_id?: number
          status_id?: number
          supplier_service_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_service_situations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "supplier_service_situations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_service_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_service_situations_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_service_situations_supplier_service_id_fkey"
            columns: ["supplier_service_id"]
            isOneToOne: false
            referencedRelation: "supplier_services"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_service_stock: {
        Row: {
          created_at: string
          id: number
          stock_entry_id: number | null
          stock_movement_id: number
          supplier_service_id: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: number
          stock_entry_id?: number | null
          stock_movement_id: number
          supplier_service_id: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: number
          stock_entry_id?: number | null
          stock_movement_id?: number
          supplier_service_id?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_service_stock_stock_entry_id_fkey"
            columns: ["stock_entry_id"]
            isOneToOne: false
            referencedRelation: "stock_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_service_stock_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_service_stock_supplier_service_id_fkey"
            columns: ["supplier_service_id"]
            isOneToOne: false
            referencedRelation: "supplier_services"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_services: {
        Row: {
          closed_short: boolean
          code: string | null
          created_at: string
          description: string
          id: number
          material_id: number | null
          module_id: number
          price_includes_tax: boolean | null
          production_order_id: number | null
          promised_date: string | null
          received_date: string | null
          situation_id: number
          start_at: string | null
          status_id: number
          supplier_class_id: number
          supplier_quotation_id: number
          supplier_type_id: number
        }
        Insert: {
          closed_short?: boolean
          code?: string | null
          created_at?: string
          description: string
          id?: number
          material_id?: number | null
          module_id: number
          price_includes_tax?: boolean | null
          production_order_id?: number | null
          promised_date?: string | null
          received_date?: string | null
          situation_id: number
          start_at?: string | null
          status_id: number
          supplier_class_id: number
          supplier_quotation_id: number
          supplier_type_id: number
        }
        Update: {
          closed_short?: boolean
          code?: string | null
          created_at?: string
          description?: string
          id?: number
          material_id?: number | null
          module_id?: number
          price_includes_tax?: boolean | null
          production_order_id?: number | null
          promised_date?: string | null
          received_date?: string | null
          situation_id?: number
          start_at?: string | null
          status_id?: number
          supplier_class_id?: number
          supplier_quotation_id?: number
          supplier_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_services_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_services_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_services_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_services_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_services_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_services_supplier_class_id_fkey"
            columns: ["supplier_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_services_supplier_quotation_id_fkey"
            columns: ["supplier_quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_service_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_services_supplier_type_id_fkey"
            columns: ["supplier_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers_profile: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          email: string
          id: number
          phone: number
          supplier_type_id: number
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string
          id: number
          phone: number
          supplier_type_id: number
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string
          id?: number
          phone?: number
          supplier_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "vw_rpt_customers"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "suppliers_profile_supplier_type_id_fkey"
            columns: ["supplier_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
          type: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          name: string
          type?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      term_groups: {
        Row: {
          code: string
          description: string | null
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      terms: {
        Row: {
          id: number
          is_active: boolean | null
          name: string
          term_group_id: number | null
        }
        Insert: {
          id?: number
          is_active?: boolean | null
          name: string
          term_group_id?: number | null
        }
        Update: {
          id?: number
          is_active?: boolean | null
          name?: string
          term_group_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_terms_term_group_id_term_groups_id"
            columns: ["term_group_id"]
            isOneToOne: false
            referencedRelation: "term_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_woo_min: {
        Row: {
          count: number | null
          description: string | null
          name: string | null
          parent: number | null
          slug: string | null
          term_id: number | null
        }
        Insert: {
          count?: number | null
          description?: string | null
          name?: string | null
          parent?: number | null
          slug?: string | null
          term_id?: number | null
        }
        Update: {
          count?: number | null
          description?: string | null
          name?: string | null
          parent?: number | null
          slug?: string | null
          term_id?: number | null
        }
        Relationships: []
      }
      types: {
        Row: {
          code: string | null
          created_at: string
          id: number
          is_active: boolean
          module_id: number
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          module_id: number
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          module_id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "types_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_capabilities: {
        Row: {
          capability_id: number
          id: number
          user_id: string
        }
        Insert: {
          capability_id: number
          id?: number
          user_id: string
        }
        Update: {
          capability_id?: number
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_capabilities_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_capabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      user_functions: {
        Row: {
          function_id: number
          id: number
          user_id: string
        }
        Insert: {
          function_id: number
          id: number
          user_id: string
        }
        Update: {
          function_id?: number
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_functions_function_id_functions_id"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_functions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      user_migrate: {
        Row: {
          account_id: number | null
          auth_user_id: string | null
          created_at: string | null
          dni: string | null
          first_name: string | null
          last_name: string | null
          manual_spent: number | null
          notes: string | null
          order_spent: number | null
          processed_at: string | null
          reward_points: number | null
          status: string | null
          total_pedidos: number | null
          ultima_compra: string | null
          user_email: string | null
          wp_hash: string | null
          wp_id: number | null
        }
        Insert: {
          account_id?: number | null
          auth_user_id?: string | null
          created_at?: string | null
          dni?: string | null
          first_name?: string | null
          last_name?: string | null
          manual_spent?: number | null
          notes?: string | null
          order_spent?: number | null
          processed_at?: string | null
          reward_points?: number | null
          status?: string | null
          total_pedidos?: number | null
          ultima_compra?: string | null
          user_email?: string | null
          wp_hash?: string | null
          wp_id?: number | null
        }
        Update: {
          account_id?: number | null
          auth_user_id?: string | null
          created_at?: string | null
          dni?: string | null
          first_name?: string | null
          last_name?: string | null
          manual_spent?: number | null
          notes?: string | null
          order_spent?: number | null
          processed_at?: string | null
          reward_points?: number | null
          status?: string | null
          total_pedidos?: number | null
          ultima_compra?: string | null
          user_email?: string | null
          wp_hash?: string | null
          wp_id?: number | null
        }
        Relationships: []
      }
      user_migrate2: {
        Row: {
          account_id: number | null
          auth_user_id: string | null
          created_at: string | null
          dni: string | null
          first_name: string | null
          last_name: string | null
          manual_spent: number | null
          notes: string | null
          order_spent: number | null
          processed_at: string | null
          reward_points: number | null
          status: string | null
          total_pedidos: number | null
          ultima_compra: string | null
          user_email: string | null
          wp_hash: string | null
          wp_id: number | null
        }
        Insert: {
          account_id?: number | null
          auth_user_id?: string | null
          created_at?: string | null
          dni?: string | null
          first_name?: string | null
          last_name?: string | null
          manual_spent?: number | null
          notes?: string | null
          order_spent?: number | null
          processed_at?: string | null
          reward_points?: number | null
          status?: string | null
          total_pedidos?: number | null
          ultima_compra?: string | null
          user_email?: string | null
          wp_hash?: string | null
          wp_id?: number | null
        }
        Update: {
          account_id?: number | null
          auth_user_id?: string | null
          created_at?: string | null
          dni?: string | null
          first_name?: string | null
          last_name?: string | null
          manual_spent?: number | null
          notes?: string | null
          order_spent?: number | null
          processed_at?: string | null
          reward_points?: number | null
          status?: string | null
          total_pedidos?: number | null
          ultima_compra?: string | null
          user_email?: string | null
          wp_hash?: string | null
          wp_id?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: number
          role_id: number
          user_id: string
        }
        Insert: {
          id?: number
          role_id: number
          user_id: string
        }
        Update: {
          id?: number
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_role_id_roles_id"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      variation_odoo: {
        Row: {
          atributo: string | null
          atributo_id: number | null
          is_variable: boolean | null
          product_id: number
          product_template_id: number
          producto: string
          sku: string | null
          valor_atributo: string | null
          valor_atributo_id: number | null
        }
        Insert: {
          atributo?: string | null
          atributo_id?: number | null
          is_variable?: boolean | null
          product_id?: number
          product_template_id?: number
          producto: string
          sku?: string | null
          valor_atributo?: string | null
          valor_atributo_id?: number | null
        }
        Update: {
          atributo?: string | null
          atributo_id?: number | null
          is_variable?: boolean | null
          product_id?: number
          product_template_id?: number
          producto?: string
          sku?: string | null
          valor_atributo?: string | null
          valor_atributo_id?: number | null
        }
        Relationships: []
      }
      variation_terms: {
        Row: {
          id: number
          product_variation_id: number
          term_id: number
        }
        Insert: {
          id?: number
          product_variation_id: number
          term_id: number
        }
        Update: {
          id?: number
          product_variation_id?: number
          term_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_variations_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variations_term_id_terms_id"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      variations: {
        Row: {
          code: string | null
          created_at: string
          id: number
          is_active: boolean
          product_cost: number | null
          product_id: number
          sku: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          product_cost?: number | null
          product_id: number
          sku?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          product_cost?: number | null
          product_id?: number
          sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_variations_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_edits: {
        Row: {
          channel_id: number
          content_json: string | null
          created_at: string
          created_by: string
          draft_json: string | null
          draft_updated_at: string | null
          draft_updated_by: string | null
          has_pending_draft: boolean | null
          id: number
          is_active: boolean
          published_at: string | null
          scheduled_at: string | null
          slug: string
          status: string
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          channel_id: number
          content_json?: string | null
          created_at?: string
          created_by?: string
          draft_json?: string | null
          draft_updated_at?: string | null
          draft_updated_by?: string | null
          has_pending_draft?: boolean | null
          id?: number
          is_active?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          slug: string
          status?: string
          title: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          channel_id?: number
          content_json?: string | null
          created_at?: string
          created_by?: string
          draft_json?: string | null
          draft_updated_at?: string | null
          draft_updated_by?: string | null
          has_pending_draft?: boolean | null
          id?: number
          is_active?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_visual_edits_channel"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_edits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "visual_edits_draft_updated_by_fkey"
            columns: ["draft_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "visual_edits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      visual_edits_medios: {
        Row: {
          created_at: string
          created_by: string
          id: number
          mimetype: string | null
          name: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          mimetype?: string | null
          name: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          mimetype?: string | null
          name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_edits_medios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string
          address_reference: string | null
          city_id: number
          code: string | null
          country_id: number
          created_at: string | null
          id: number
          is_active: boolean
          name: string
          neighborhood_id: number
          product_id: number
          state_id: number
          supplier_id: number | null
        }
        Insert: {
          address: string
          address_reference?: string | null
          city_id: number
          code?: string | null
          country_id: number
          created_at?: string | null
          id?: number
          is_active?: boolean
          name: string
          neighborhood_id: number
          product_id?: number
          state_id: number
          supplier_id?: number | null
        }
        Update: {
          address?: string
          address_reference?: string | null
          city_id?: number
          code?: string | null
          country_id?: number
          created_at?: string | null
          id?: number
          is_active?: boolean
          name?: string
          neighborhood_id?: number
          product_id?: number
          state_id?: number
          supplier_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      wc_product_export: {
        Row: {
          ID: number | null
          "Precio normal": number | null
          "Precio rebajado": number | null
          SKU: string | null
          Tipo: string | null
        }
        Insert: {
          ID?: number | null
          "Precio normal"?: number | null
          "Precio rebajado"?: number | null
          SKU?: string | null
          Tipo?: string | null
        }
        Update: {
          ID?: number | null
          "Precio normal"?: number | null
          "Precio rebajado"?: number | null
          SKU?: string | null
          Tipo?: string | null
        }
        Relationships: []
      }
      woo_product_odoo: {
        Row: {
          code: string | null
          product_id: number | null
          product_template_id: number | null
          woo_id: string | null
          woo_instance: number | null
        }
        Insert: {
          code?: string | null
          product_id?: number | null
          product_template_id?: number | null
          woo_id?: string | null
          woo_instance?: number | null
        }
        Update: {
          code?: string | null
          product_id?: number | null
          product_template_id?: number | null
          woo_id?: string | null
          woo_instance?: number | null
        }
        Relationships: []
      }
      woo_products_may: {
        Row: {
          instance_id: number | null
          name: string | null
          product_template_id: number
          product_tmpl_id: number | null
          title: string
          woo_id: string | null
        }
        Insert: {
          instance_id?: number | null
          name?: string | null
          product_template_id?: number
          product_tmpl_id?: number | null
          title: string
          woo_id?: string | null
        }
        Update: {
          instance_id?: number | null
          name?: string | null
          product_template_id?: number
          product_tmpl_id?: number | null
          title?: string
          woo_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mvw_rpt_customer_aggregates: {
        Row: {
          avg_ticket: number | null
          customer_lastname: string | null
          customer_name: string | null
          has_account: boolean | null
          last_order_date: string | null
          order_count: number | null
          total_spent: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      mvw_rpt_daily_sales: {
        Row: {
          avg_ticket: number | null
          branch_id: number | null
          branch_name: string | null
          city_id: number | null
          country_id: number | null
          order_count: number | null
          sale_date: string | null
          sale_type_id: number | null
          sale_type_name: string | null
          state_id: number | null
          total_discount: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sale_type_id_fkey"
            columns: ["sale_type_id"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
        ]
      }
      mvw_rpt_product_sales: {
        Row: {
          category_id: number | null
          category_name: string | null
          order_count: number | null
          product_id: number | null
          product_title: string | null
          product_variation_id: number | null
          sku: string | null
          total_quantity: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_products_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_categories_category_id_categories_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_variations_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mvw_rpt_return_products: {
        Row: {
          product_id: number | null
          product_title: string | null
          product_variation_id: number | null
          reason: string | null
          return_count: number | null
          return_type_id: number | null
          return_type_name: string | null
          sku: string | null
          total_quantity_returned: number | null
          total_refund_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_variations_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_products_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_return_type_id_fkey"
            columns: ["return_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_totals: {
        Row: {
          order_id: number | null
          total_pagado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_product_stock_virtual: {
        Row: {
          id: number | null
          product_variation_id: number | null
          stock: number | null
          stock_type_id: number | null
          virtual_stock: number | null
          warehouse_id: number | null
        }
        Insert: {
          id?: number | null
          product_variation_id?: number | null
          stock?: number | null
          stock_type_id?: number | null
          virtual_stock?: never
          warehouse_id?: number | null
        }
        Update: {
          id?: number | null
          product_variation_id?: number | null
          stock?: number | null
          stock_type_id?: number | null
          virtual_stock?: never
          warehouse_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_stock_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_stock_warehouse_id_warehouses_id"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_stock_type_id_fkey"
            columns: ["stock_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_rpt_customers: {
        Row: {
          account_id: number | null
          amount_spent: number | null
          created_at: string | null
          document_number: string | null
          last_name: string | null
          loyalty_level: string | null
          name: string | null
          orders_quantity: number | null
          points: number | null
        }
        Relationships: []
      }
      vw_rpt_order_customers: {
        Row: {
          customer_key: string | null
          customer_label: string | null
          document_number: string | null
          document_type: number | null
          has_account: boolean | null
          is_anonymous: boolean | null
          order_id: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_document_type_fkey"
            columns: ["document_type"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      vw_rpt_order_items: {
        Row: {
          id: number | null
          net_quantity: number | null
          order_id: number | null
          product_discount: number | null
          product_id: number | null
          product_name: string | null
          product_price: number | null
          product_title: string | null
          product_variation_id: number | null
          quantity: number | null
          returned_quantity: number | null
          sku: string | null
          warehouse_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_products_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_products_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "fk_order_products_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_products_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_variations_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_warehouses_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_rpt_order_payments: {
        Row: {
          amount: number | null
          date: string | null
          id: number | null
          order_id: number | null
          payment_method_code: string | null
          payment_method_id: number | null
          payment_method_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "fk_order_payment_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_payment_payment_method_id_payment_methods_id"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_rpt_orders: {
        Row: {
          branch_id: number | null
          branch_name: string | null
          city_id: number | null
          city_name: string | null
          country_id: number | null
          country_name: string | null
          created_at: string | null
          customer_lastname: string | null
          customer_name: string | null
          date: string | null
          discount: number | null
          document_number: string | null
          document_type: number | null
          id: number | null
          neighborhood_id: number | null
          neighborhood_name: string | null
          sale_type_code: string | null
          sale_type_id: number | null
          sale_type_name: string | null
          shipping_cost: number | null
          situation_code: string | null
          situation_id: number | null
          situation_name: string | null
          state_id: number | null
          state_name: string | null
          status_code: string | null
          status_id: number | null
          status_name: string | null
          subtotal: number | null
          total: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_situations_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_document_type_fkey"
            columns: ["document_type"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_neighborhood_id_city_id_state_id_country_id_fkey"
            columns: ["neighborhood_id", "city_id", "state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id", "city_id", "state_id", "country_id"]
          },
          {
            foreignKeyName: "orders_sale_type_id_fkey"
            columns: ["sale_type_id"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
        ]
      }
      vw_rpt_returns: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number | null
          order_id: number | null
          reason: string | null
          return_type_id: number | null
          return_type_name: string | null
          situation_id: number | null
          status_id: number | null
          total_refund_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_order_customers"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_rpt_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_return_type_id_fkey"
            columns: ["return_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_rpt_stock: {
        Row: {
          id: number | null
          product_active: boolean | null
          product_id: number | null
          product_title: string | null
          product_variation_id: number | null
          sku: string | null
          stock: number | null
          stock_type_id: number | null
          warehouse_id: number | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_stock_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_stock_warehouse_id_warehouses_id"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_variations_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_stock_type_id_fkey"
            columns: ["stock_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_sku_effective_stock: {
        Row: {
          product_id: number | null
          product_title: string | null
          product_variation_id: number | null
          sku: string | null
          stock_total: number | null
          warehouse_ids: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_stock_product_variation_id_product_variations_id"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_variations_product_id_products_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_stock_movement_items: {
        Args: {
          p_created_by?: string
          p_items?: Json
          p_message?: string
          p_situation_code: string
          p_stock_movement_request_id: number
        }
        Returns: {
          created_at: string
          created_by: string
          id: number
          last_row: boolean
          message: string | null
          module_id: number
          notes: string | null
          situation_id: number
          status_id: number
          stock_movement_request_id: number
          warehouse_id: number
        }
        SetofOptions: {
          from: "*"
          to: "stock_movement_request_situations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_expired_orders: { Args: never; Returns: undefined }
      comprueba_variacion: {
        Args: { p_term_ids: number[]; p_variation_id: number }
        Returns: boolean
      }
      create_bar_code: {
        Args: {
          p_created_by: string
          p_price_list_id: number
          p_product_variation_id: number
          p_quantities: number
          p_sequence: number
          p_stock_movement_id?: number
        }
        Returns: {
          created_at: string
          created_by: string
          id: number
          price_list_id: number
          product_variation_id: number
          quantities: number | null
          sequence: number
          stock_movement_id: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bar_codes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_stock_movement_request: {
        Args: {
          p_created_by: string
          p_in_warehouse_id: number
          p_items: Json
          p_module_code: string
          p_movement_type_code: string
          p_out_warehouse_id: number
          p_reason: string
          p_situation_code: string
        }
        Returns: Json
      }
      fn_category_path: { Args: { p_category_id: number }; Returns: string }
      fn_chbot_active_session: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: {
          account_id: number | null
          address: string | null
          address_reference: string | null
          cart_id: number | null
          channel_id: number
          city_id: number | null
          country_id: number | null
          coupon_code: string | null
          created_at: string
          document_number: string | null
          document_type_id: number | null
          email: string | null
          id: number
          is_active: boolean
          last_name: string | null
          merged_into_id: number | null
          name: string | null
          neighborhood_id: number | null
          order_id: number | null
          payment_method_id: number | null
          phone_number: number | null
          profile_id: string | null
          receipt_data: string | null
          receipt_type: string | null
          reception_person: string | null
          reception_phone: string | null
          shipping_cost: number | null
          shipping_method_id: number | null
          state_id: number | null
          updated_at: string
          whatsapp_user_id: string | null
          whatsapp_username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "chat_last_conversation_info"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_chbot_cart_ttl: { Args: never; Returns: string }
      fn_chbot_channel_config: {
        Args: never
        Returns: {
          branch_id: number
          price_list_id: number
          sale_type_id: number
          stock_type_id: number
          warehouse_id: number
        }[]
      }
      fn_chbot_effective_phone: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: number
      }
      fn_chbot_plain_detail: { Args: { p_html: string }; Returns: string }
      fn_create_notification_for_permissions: {
        Args: {
          p_entity_id: string
          p_message: string
          p_module_id: number
          p_permission_codes: string[]
          p_title: string
          p_type: string
        }
        Returns: number
      }
      fn_crew_level: { Args: { p_points: number }; Returns: number }
      fn_crew_level_info: {
        Args: { p_points: number }
        Returns: {
          active: boolean
          color: string | null
          created_at: string
          discount: number
          id: number
          image_url: string | null
          max_points: number | null
          min_points: number
          name: string
          sort_order: number
          subtitle: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "customer_levels"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_crew_points_to_next_level: {
        Args: { p_points: number }
        Returns: number
      }
      fn_crm_bot_should_answer: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: boolean
      }
      fn_crm_conversation_assignee: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: string
      }
      fn_crm_conversation_taken_by: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: string
      }
      fn_current_user_has_any_permission: {
        Args: { p_codes: string[] }
        Returns: boolean
      }
      fn_ec_stock: {
        Args: { p_channel_id?: number }
        Returns: {
          id: number
          product_variation_id: number
          stock: number
          stock_type_id: number
          virtual_stock: number
          warehouse_id: number
        }[]
      }
      fn_explosion_description: {
        Args: { p_explosion_id: number }
        Returns: string
      }
      fn_explosion_material_quantity: {
        Args: { p_explosion_material_id: number; p_variation_id: number }
        Returns: number
      }
      fn_fch_credit_business_account: {
        Args: { p_account_id: number }
        Returns: number
      }
      fn_get_supplier_profile_id_by_document: {
        Args: { p_doc_number: string; p_doc_type_code: string }
        Returns: number
      }
      fn_is_credit_business_account: {
        Args: { p_business_account_id: number }
        Returns: boolean
      }
      fn_low_stock_threshold: { Args: never; Returns: number }
      fn_min_stock_external_channel_codes: { Args: never; Returns: string[] }
      fn_min_stock_external_default: { Args: never; Returns: number }
      fn_move_service_material_stock: {
        Args: {
          p_from_material_id: number
          p_service_id: number
          p_to_material_id: number
        }
        Returns: undefined
      }
      fn_next_production_order_code: {
        Args: { p_class_id: number }
        Returns: string
      }
      fn_next_supplier_quotation_code: {
        Args: { p_prefix: string }
        Returns: string
      }
      fn_normalize_pe_phone: { Args: { p_raw: string }; Returns: string }
      fn_permission_min_level: { Args: { p_code: string }; Returns: number }
      fn_production_order_code_prefix: {
        Args: { p_class_id: number }
        Returns: string
      }
      fn_production_order_item_display: {
        Args: { p_item_id: number }
        Returns: Json
      }
      fn_production_order_item_label: {
        Args: { p_item_id: number }
        Returns: string
      }
      fn_production_order_item_label_full: {
        Args: { p_item_id: number }
        Returns: string
      }
      fn_production_order_item_output: {
        Args: { p_item_id: number }
        Returns: number
      }
      fn_production_order_item_progress: {
        Args: { p_order_id: number }
        Returns: {
          advanced: number
          bad: number
          process_group_id: number
          production_order_item_id: number
          remaining: number
          requested: number
          step_order: number
        }[]
      }
      fn_production_order_item_received: {
        Args: { p_item_id: number }
        Returns: number
      }
      fn_production_order_item_route_done: {
        Args: { p_order_id: number }
        Returns: {
          production_order_item_id: number
          route_done: boolean
        }[]
      }
      fn_production_order_item_snapshot_materials: {
        Args: { p_item_id: number }
        Returns: undefined
      }
      fn_production_order_item_status: {
        Args: { p_item_id: number }
        Returns: string
      }
      fn_production_order_item_unit_cost: {
        Args: { p_item_id: number }
        Returns: number
      }
      fn_production_order_process_progress: {
        Args: { p_order_id: number }
        Returns: {
          advanced: number
          bad: number
          process_group_id: number
          remaining: number
          requested: number
          step_order: number
        }[]
      }
      fn_production_order_process_state: {
        Args: { p_order_id: number }
        Returns: {
          blocked_by: string
          is_blocked: boolean
          is_complete: boolean
          process_group_id: number
          process_group_name: string
          process_id: number
          process_name: string
          step_order: number
          steps_done: number
          steps_total: number
        }[]
      }
      fn_production_order_status: {
        Args: { p_order_id: number }
        Returns: string
      }
      fn_production_order_step_dates: {
        Args: { p_order_id: number }
        Returns: {
          actual_end: string
          actual_start: string
          delay_days: number
          planned_end: string
          planned_start: string
          process_id: number
          step_order: number
        }[]
      }
      fn_production_order_step_incoming: {
        Args: { p_order_id: number }
        Returns: {
          incoming: number
          info_id: number
          step_order: number
          supplier_service_id: number
        }[]
      }
      fn_production_order_step_items: {
        Args: { p_order_id: number }
        Returns: {
          info_id: number
          item_id: number
          supplier_service_id: number
        }[]
      }
      fn_refresh_report_mviews: { Args: never; Returns: undefined }
      fn_register_service_material_stock: {
        Args: { p_situation_id: number; p_warehouse_id: number }
        Returns: undefined
      }
      fn_replace_explosion_materials: {
        Args: { p_explosion_id: number; p_materials: Json }
        Returns: number
      }
      fn_replace_production_order_items: {
        Args: {
          p_items: Json
          p_production_id: number
          p_warehouse_id?: number
        }
        Returns: number
      }
      fn_resolve_stock_type_id: {
        Args: {
          p_payload_value?: number
          p_variation_id: number
          p_warehouse_id: number
        }
        Returns: number
      }
      fn_return_covers_full_order: {
        Args: {
          p_exclude_return_id?: number
          p_is_physical: boolean
          p_order_id: number
          p_return_products: Json
        }
        Returns: boolean
      }
      fn_rpt_default_return_situations: { Args: never; Returns: number[] }
      fn_subscription_permissions_materialize: {
        Args: { p_permission_id: number }
        Returns: number
      }
      fn_supplier_quotation_code_prefix: {
        Args: { p_quotation_id: number }
        Returns: string
      }
      fn_supplier_service_done_order: { Args: never; Returns: number }
      fn_supplier_service_has_advanced: {
        Args: { p_service_id: number }
        Returns: boolean
      }
      fn_supplier_service_is_dispatched: {
        Args: { p_service_id: number }
        Returns: boolean
      }
      fn_supplier_service_is_done: {
        Args: { p_service_id: number }
        Returns: boolean
      }
      fn_supplier_service_is_locked: {
        Args: { p_service_id: number }
        Returns: boolean
      }
      fn_supplier_service_items: {
        Args: { p_service_id: number }
        Returns: {
          production_order_id: number
          production_order_item_id: number
          variation_id: number
        }[]
      }
      fn_supplier_service_label: {
        Args: { p_description: string; p_production_order_id: number }
        Returns: string
      }
      fn_supplier_service_paid: {
        Args: { p_service_id: number }
        Returns: number
      }
      fn_supplier_service_payable: {
        Args: { p_service_id: number }
        Returns: number
      }
      fn_supplier_service_payable_order: { Args: never; Returns: number }
      fn_supplier_service_requested_quantity: {
        Args: { p_service_id: number }
        Returns: number
      }
      fn_supplier_service_stock_situation_code: { Args: never; Returns: string }
      fn_sync_production_order_material_consumption: {
        Args: { p_production_id: number }
        Returns: undefined
      }
      fn_users_with_permissions: {
        Args: { p_permission_codes: string[] }
        Returns: {
          user_id: string
        }[]
      }
      get_clients_list: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_max_amount?: number
          p_max_purchases?: number
          p_min_amount?: number
          p_min_purchases?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      get_pos_session_detail: { Args: { p_session_id: number }; Returns: Json }
      get_pos_sessions_list:
        | {
            Args: {
              p_auth_user_id?: string
              p_closed_date?: string
              p_filter_user_id?: string
              p_opened_date?: string
              p_page?: number
              p_search?: string
              p_size?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_auth_user_id?: string
              p_branch_id?: number
              p_closed_date?: string
              p_filter_user_id?: string
              p_opened_date?: string
              p_page?: number
              p_search?: string
              p_size?: number
            }
            Returns: Json
          }
      get_product_attribute_groups: {
        Args: { p_product_id: number }
        Returns: Json
      }
      get_products_list: {
        Args: {
          p_brand_id?: number
          p_category?: number
          p_category_ids?: number[]
          p_max_price?: number
          p_maxstock?: number
          p_min_price?: number
          p_minstock?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_status?: boolean
          p_tag_id?: number
          p_web?: boolean
        }
        Returns: Json
      }
      get_sales_form_data: { Args: never; Returns: Json }
      get_stock_movement_requests: {
        Args: {
          p_page?: number
          p_situation_id?: number
          p_size?: number
          p_user_warehouse_id: number
          p_view: string
        }
        Returns: Json
      }
      get_user_functions: { Args: { p_user_id: string }; Returns: Json }
      get_variation_by_terms: {
        Args: { p_product_id: number; terms_id: number[] }
        Returns: Json
      }
      handle_powerpay_webhook: {
        Args: {
          p_created_at: string
          p_signature: string
          p_status: string
          p_transaction_id: string
        }
        Returns: Json
      }
      prueba1: {
        Args: {
          p_category?: number
          p_max_price?: number
          p_maxstock?: number
          p_min_price?: number
          p_minstock?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_status?: boolean
          p_web?: boolean
        }
        Returns: Json
      }
      sp_add_supplier_payment: {
        Args: {
          p_amount: number
          p_business_account_id: number
          p_date?: string
          p_description?: string
          p_payment_method_id: number
          p_supplier_quotation_id: number
          p_supplier_service_id?: number
          p_voucher_url?: string
        }
        Returns: Json
      }
      sp_add_supplier_payments_bulk: {
        Args: {
          p_business_account_id: number
          p_date?: string
          p_description?: string
          p_payment_method_id: number
          p_payments: Json
        }
        Returns: Json
      }
      sp_add_supplier_quotation_service: {
        Args: {
          p_code?: string
          p_description: string
          p_material_id?: number
          p_measurement_unit?: string
          p_new_material?: Json
          p_price?: number
          p_price_includes_tax?: boolean
          p_production_order_id?: number
          p_promised_date?: string
          p_quantity?: number
          p_received_date?: string
          p_start_at?: string
          p_supplier_class_id: number
          p_supplier_quotation_id: number
        }
        Returns: Json
      }
      sp_add_to_cart: {
        Args: {
          p_branch_id: number
          p_cart_id: number
          p_channel_id?: number
          p_price_list_id: number
          p_quantity: number
          p_sale_type_id: number
          p_stock_type_id: number
          p_user_id: string
          p_variation_id: number
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_change_order_products: {
        Args: {
          p_branch_id: number
          p_customer_document_number: string
          p_customer_document_type_id: number
          p_order_id: number
          p_order_situation_id: number
          p_return_products: Json
          p_stock_type_id: number
          p_user_id: string
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_chbot_add_to_cart: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_quantity?: number
          p_variation_id?: number
          p_whatsapp_user_id?: string
          p_whatsapp_username?: string
        }
        Returns: Json
      }
      sp_chbot_cleanup_expired_sessions: { Args: never; Returns: undefined }
      sp_chbot_get_cart: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_chbot_get_catalog:
        | { Args: { p_busqueda?: string }; Returns: Json }
        | { Args: { p_busqueda?: string; p_talla?: string }; Returns: Json }
        | {
            Args: {
              p_busqueda?: string
              p_channel_id: number
              p_talla?: string
            }
            Returns: Json
          }
      sp_chbot_get_order: {
        Args: {
          p_channel_id: number
          p_order_id?: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_chbot_get_order_status: { Args: { p_order_id: number }; Returns: Json }
      sp_chbot_get_product_info: {
        Args: {
          p_busqueda?: string
          p_channel_id: number
          p_product_id?: number
          p_talla?: string
        }
        Returns: Json
      }
      sp_chbot_get_promotions: {
        Args: {
          p_category?: string
          p_channel_id: number
          p_code?: string
          p_product_id?: number
        }
        Returns: Json
      }
      sp_chbot_get_session: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_chbot_get_user:
        | {
            Args: {
              p_channel_id: number
              p_correo?: string
              p_dni?: string
              p_opcion?: string
            }
            Returns: Json
          }
        | {
            Args: { p_correo?: string; p_dni?: string; p_opcion?: string }
            Returns: Json
          }
      sp_chbot_link_phone: {
        Args: {
          p_channel_id: number
          p_phone_number: number
          p_whatsapp_user_id: string
          p_whatsapp_username?: string
        }
        Returns: Json
      }
      sp_chbot_relink_whatsapp_user_id: {
        Args: {
          p_channel_id: number
          p_new_whatsapp_user_id: string
          p_old_whatsapp_user_id: string
        }
        Returns: Json
      }
      sp_chbot_reuse_customer_info: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_source_id?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_chbot_save_order_receipt_note: {
        Args: {
          p_order_id: number
          p_receipt_data?: string
          p_receipt_type: string
        }
        Returns: Json
      }
      sp_chbot_start_session: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
          p_whatsapp_username?: string
        }
        Returns: Json
      }
      sp_chbot_update_cart_item: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_quantity?: number
          p_variation_id?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_chbot_update_customer_info: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_updates?: Json
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_chbot_update_order: {
        Args: { p_channel_id: number; p_order_id: number; p_updates: Json }
        Returns: Json
      }
      sp_cleanup_anonymous_cart: { Args: { p_cart_id: number }; Returns: Json }
      sp_close_pos_session: {
        Args: {
          p_closing_amount: number
          p_notes?: string
          p_session_id: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_close_production_order_item_intake: {
        Args: { p_item_id: number }
        Returns: Json
      }
      sp_close_supplier_service_short: {
        Args: { p_close?: boolean; p_supplier_service_id: number }
        Returns: Json
      }
      sp_create_business_account: {
        Args: {
          p_account_branch_id?: number
          p_account_id: number
          p_account_number: number
          p_bank: string
          p_branch_id: number
          p_business_account_type_id: number
          p_name: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_create_complaints_book: {
        Args: {
          p_address: string
          p_age: boolean
          p_amount_claim: number
          p_apoderado_document_number?: string
          p_apoderado_document_type_id?: number
          p_apoderado_email?: string
          p_apoderado_phone?: string
          p_city_id: number
          p_claim_description: string
          p_claim_type: string
          p_complaining_request: string
          p_country_id: number
          p_detail: string
          p_document_number: string
          p_document_type_id: number
          p_email: string
          p_good: string
          p_incident_date: string
          p_last_name: string
          p_last_name2: string
          p_name: string
          p_name_apoderado?: string
          p_neighborhood_id: number
          p_phone: string
          p_state_id: number
          p_terms?: boolean
        }
        Returns: Json
      }
      sp_create_complaints_book_note: {
        Args: {
          p_code?: string
          p_complaints_book_id: number
          p_image_url?: string
          p_message: string
          p_user_id?: string
        }
        Returns: Json
      }
      sp_create_explosion: {
        Args: {
          p_description?: string
          p_materials?: Json
          p_model_code?: string
          p_variation_ids?: number[]
        }
        Returns: Json
      }
      sp_create_material_service_dispatch: {
        Args: {
          p_created_by: string
          p_destination_warehouse_id: number
          p_items: Json
          p_production_order_id: number
          p_supplier_quotation_id: number
          p_supplier_service_id: number
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_create_material_stock_movements: {
        Args: {
          p_created_by: string
          p_items: Json
          p_user_warehouse_id?: number
        }
        Returns: Json
      }
      sp_create_movement: {
        Args: {
          p_amount: number
          p_branch_id: number
          p_business_account_id?: number
          p_description: string
          p_files_url?: string[]
          p_movement_class_id: number
          p_movement_date: string
          p_movement_type_id: number
          p_payment_method_id: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_create_movements_type_stock: {
        Args: { p_created_by: string; p_items: Json; p_warehouse_id: number }
        Returns: Json
      }
      sp_create_order: {
        Args: {
          p_branch_id?: number
          p_change_entries: Json
          p_customer_user_id?: string
          p_discounts: Json
          p_initial_situation_id?: number
          p_is_existing_client?: boolean
          p_order_data: Json
          p_payments: Json
          p_products: Json
          p_user_id: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_create_order_chanel_type: {
        Args: {
          p_code: string
          p_module_code: string
          p_module_id: number
          p_name: string
          p_payment_methods: number[]
        }
        Returns: Json
      }
      sp_create_payment_method: {
        Args: {
          p_active?: boolean
          p_business_account_id: number
          p_name: string
        }
        Returns: Json
      }
      sp_create_price_list: {
        Args: { p_code: string; p_name: string }
        Returns: Json
      }
      sp_create_process: {
        Args: { p_code?: string; p_name: string; p_process_group_id?: number }
        Returns: Json
      }
      sp_create_process_group: {
        Args: { p_code?: string; p_name: string }
        Returns: Json
      }
      sp_create_product:
        | {
            Args: {
              p_active: boolean
              p_categories: number[]
              p_description: string
              p_exhibition_end_date?: string
              p_exhibition_start_date?: string
              p_images: Json
              p_is_variable: boolean
              p_short_description: string
              p_tags?: number[]
              p_title: string
              p_user_id: string
              p_variations: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_active: boolean
              p_brands?: number[]
              p_categories: number[]
              p_description: string
              p_exhibition_end_date?: string
              p_exhibition_start_date?: string
              p_images: Json
              p_is_variable: boolean
              p_promotional_bg_color?: string
              p_promotional_text?: string
              p_promotional_text_color?: string
              p_short_description: string
              p_sizes_image_url?: string
              p_tags?: number[]
              p_title: string
              p_user_id?: string
              p_variations: Json
              p_web: boolean
            }
            Returns: Json
          }
      sp_create_production_order: {
        Args: {
          p_description?: string
          p_finish_date?: string
          p_items?: Json
          p_name: string
          p_production_order_class_id: number
          p_promised_date?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_create_production_order_quotation_link: {
        Args: { p_production_order_id: number; p_quotation_id: number }
        Returns: Json
      }
      sp_create_return: {
        Args: { p_payload: Json; p_user_id: string }
        Returns: Json
      }
      sp_create_stock_movements_entrance: {
        Args: {
          p_created_by: string
          p_items: Json
          p_user_warehouse_id?: number
        }
        Returns: Json
      }
      sp_create_stock_type: {
        Args: { p_code: string; p_name: string }
        Returns: Json
      }
      sp_create_supplier_quotation: {
        Args: {
          p_code?: string
          p_currency?: string
          p_payment_terms?: string
          p_request_description?: string
          p_services?: Json
          p_subject: string
          p_supplier_id: number
        }
        Returns: Json
      }
      sp_create_supplier_service: {
        Args: {
          p_code?: string
          p_description: string
          p_material_id?: number
          p_measurement_unit?: string
          p_new_material?: Json
          p_price?: number
          p_price_includes_tax?: boolean
          p_process_group_id?: number
          p_process_id?: number
          p_production_order_id?: number
          p_promised_date?: string
          p_quantity?: number
          p_received_date?: string
          p_start_at?: string
          p_step_order?: number
          p_supplier_class_id: number
          p_supplier_quotation_id: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_create_supplier_services_by_item: {
        Args: {
          p_code?: string
          p_description: string
          p_material_id?: number
          p_measurement_unit?: string
          p_new_material?: Json
          p_price?: number
          p_price_includes_tax?: boolean
          p_process_group_id?: number
          p_process_id?: number
          p_production_order_id?: number
          p_production_order_item_ids: number[]
          p_promised_date?: string
          p_quantity?: number
          p_received_date?: string
          p_start_at?: string
          p_step_order?: number
          p_supplier_class_id?: number
          p_supplier_quotation_id: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_create_user_profile: {
        Args: {
          p_address?: string
          p_address_reference?: string
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_document_number?: string
          p_document_type_id?: number
          p_last_name?: string
          p_last_name2?: string
          p_middle_name?: string
          p_name: string
          p_neighborhood_id?: number
          p_role_ids?: number[]
          p_show?: boolean
          p_state_id?: number
          p_type_ids?: number[]
          p_uid: string
          p_user_name?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_crm_assign_conversation: {
        Args: {
          p_assigned_to?: string
          p_channel_id: number
          p_only_if_unassigned?: boolean
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_crm_channel_costs: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      sp_crm_channel_metrics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      sp_crm_channel_over_time: {
        Args: {
          p_end_date?: string
          p_granularity?: string
          p_start_date?: string
        }
        Returns: Json
      }
      sp_crm_channel_top_products: {
        Args: {
          p_code?: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_crm_conversation_thread: {
        Args: {
          p_before_id?: number
          p_channel_code?: string
          p_limit?: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_crm_conversations_board: {
        Args: {
          p_assigned_to?: string
          p_channel_code?: string
          p_limit_column?: number
          p_search?: string
        }
        Returns: Json
      }
      sp_crm_conversations_list: {
        Args: {
          p_assigned_to?: string
          p_channel_code?: string
          p_page?: number
          p_search?: string
          p_situation_id?: number
          p_size?: number
          p_taken?: boolean
          p_unassigned?: boolean
        }
        Returns: Json
      }
      sp_crm_log_outgoing_message: {
        Args: {
          p_channel_id: number
          p_media_filename?: string
          p_media_mime?: string
          p_media_path?: string
          p_media_size_bytes?: number
          p_media_type?: string
          p_media_url?: string
          p_message: string
          p_phone_number?: number
          p_sent_by: string
          p_wamid: string
          p_whatsapp_user_id?: string
          p_whatsapp_username?: string
        }
        Returns: Json
      }
      sp_crm_send_precheck: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_crm_set_conversation_situation: {
        Args: {
          p_channel_id: number
          p_message?: string
          p_phone_number?: number
          p_situation_id: number
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_crm_take_conversation: {
        Args: {
          p_channel_id: number
          p_phone_number?: number
          p_release?: boolean
          p_whatsapp_user_id?: string
        }
        Returns: Json
      }
      sp_customer_levels_upsert: {
        Args: {
          p_active?: boolean
          p_color?: string
          p_discount?: number
          p_id?: number
          p_image_url?: string
          p_max_points?: number
          p_min_points?: number
          p_name?: string
          p_sort_order?: number
          p_subtitle?: string
        }
        Returns: Json
      }
      sp_delete_business_account: { Args: { p_id: number }; Returns: Json }
      sp_delete_payment_method: { Args: { p_id: number }; Returns: Json }
      sp_delete_price_list: { Args: { p_id: number }; Returns: Json }
      sp_delete_price_rules: { Args: { p_ids: number[] }; Returns: Json }
      sp_delete_process: { Args: { p_id: number }; Returns: Json }
      sp_delete_process_group: { Args: { p_id: number }; Returns: Json }
      sp_delete_production_order_quotation_link: {
        Args: { p_production_order_id: number; p_quotation_id: number }
        Returns: Json
      }
      sp_delete_stock_types: { Args: { p_id: number }; Returns: Json }
      sp_ec_create_account_profile: {
        Args: {
          p_auth_uid: string
          p_document_number: string
          p_document_type_id: number
          p_email: string
          p_last_name: string
          p_last_name2: string
          p_middle_name: string
          p_name: string
        }
        Returns: Json
      }
      sp_ec_create_order: {
        Args: {
          p_branch_id: number
          p_change_entries: Json
          p_channel_id?: number
          p_discounts?: Json
          p_initial_situation_id: number
          p_is_existing_client: boolean
          p_is_mercadopago: boolean
          p_order_data: Json
          p_payments: Json
          p_products: Json
          p_sale_type_id: number
          p_stock_type_id: number
          p_user_id: string
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_ec_get_categories_ids: {
        Args: { p_categories_ids?: number[] }
        Returns: Json
      }
      sp_ec_get_categories_with_products: {
        Args: { p_stock_type_id: number; p_warehouse_id: number }
        Returns: Json
      }
      sp_ec_get_complet_outfit: {
        Args: {
          p_branch_id: number
          p_channel_id: number
          p_exclude_category_id: number[]
          p_price_list_id: number
          p_sale_type_id: number
          p_stock_type_id: number
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_ec_get_customer_orders: {
        Args: { p_price_list_id?: number; p_user_id: string }
        Returns: Json
      }
      sp_ec_get_order_details: {
        Args: {
          p_branch_id?: number
          p_order_id?: number
          p_price_list_id?: number
          p_sale_type_id?: number
          p_stock_type_id?: number
          p_user_id?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_ec_get_order_success: { Args: { p_order_id: number }; Returns: Json }
      sp_ec_get_product_detail: {
        Args: {
          p_branch_id?: number
          p_channel_id?: number
          p_price_list_id?: number
          p_product_id?: number
          p_sale_type_id?: number
          p_stock_type_id?: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_ec_get_product_ids: {
        Args: {
          p_branch_id: number
          p_brand_id?: number
          p_category_ids: number[]
          p_channel_id: number
          p_order: string
          p_price_list_id: number
          p_product_ids: number[]
          p_sale_price: boolean
          p_sale_type_id: number
          p_search: string
          p_size: number
          p_source?: string
          p_stock_type_id: number
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_ec_get_product_list: {
        Args: {
          p_branch_id: number
          p_category_id: number
          p_channel_id: number
          p_order: string
          p_page: number
          p_price_list_id: number
          p_sale_price: boolean
          p_sale_type_id: number
          p_search: string
          p_size: number
          p_stock_type_id: number
          p_term_id: number
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_ec_get_shipping_methods: {
        Args: {
          p_city_id?: number
          p_country_id: number
          p_neighborhood_id?: number
          p_state_id?: number
        }
        Returns: Json
      }
      sp_ec_get_similar_products: {
        Args: {
          p_branch_id: number
          p_category_id: number
          p_channel_id: number
          p_exclude_product_id: number[]
          p_price_list_id: number
          p_sale_type_id: number
          p_stock_type_id: number
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_ec_get_user_profile: { Args: { p_user_id: string }; Returns: Json }
      sp_ec_level_up_crew: {
        Args: { p_account_id: number; p_order_id: number }
        Returns: Json
      }
      sp_ec_update_user_profile: {
        Args: {
          p_address?: string
          p_city_id?: number
          p_country_id?: number
          p_email?: string
          p_last_name: string
          p_name: string
          p_neighborhood_id?: number
          p_state_id?: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_fch_apply_franchise_payment: {
        Args: {
          p_branch_id?: number
          p_business_account_id: number
          p_credit_amount?: number
          p_credit_business_account_id?: number
          p_credit_payment_method_id?: number
          p_files_url: string[]
          p_franchise_name: string
          p_items: Json
          p_movement_code: string
          p_payment_date?: string
          p_payment_method_id: number
          p_pending_request_id: number
          p_tenant_reference: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_fch_apply_franchise_return: {
        Args: {
          p_account_id: number
          p_branch_id?: number
          p_items: Json
          p_return_date?: string
          p_return_id: string
          p_tenant_reference: string
          p_user_id: string
        }
        Returns: Json
      }
      sp_fch_apply_franchise_sale: { Args: { p_items: Json }; Returns: Json }
      sp_fch_apply_quantity_adjustment: {
        Args: {
          p_action: string
          p_note?: string
          p_pending_request_id: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_fch_upsert_franchisee_account: {
        Args: {
          p_document_number: string
          p_document_type_code: string
          p_email?: string
          p_last_name?: string
          p_last_name2?: string
          p_middle_name?: string
          p_name: string
          p_tenant_reference: string
        }
        Returns: Json
      }
      sp_ges_set_subscription: { Args: { p_plan_code: string }; Returns: Json }
      sp_get_accounts: {
        Args: {
          p_account_type?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_show?: boolean
          p_size?: number
        }
        Returns: Json
      }
      sp_get_birthday_notifications: {
        Args: {
          p_page?: number
          p_search?: string
          p_size?: number
          p_today?: string
        }
        Returns: Json
      }
      sp_get_branches: {
        Args: {
          p_cities?: number
          p_countries?: number
          p_neighborhoods?: number
          p_page?: number
          p_search?: string
          p_size?: number
          p_states?: number
          p_warehouse?: number
        }
        Returns: Json
      }
      sp_get_brands: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_business_accounts: {
        Args: { p_page?: number; p_size?: number }
        Returns: Json
      }
      sp_get_cart: {
        Args: { p_is_active?: boolean; p_page?: number; p_size?: number }
        Returns: Json
      }
      sp_get_cart_details: {
        Args: {
          p_branch_id?: number
          p_cart_id?: number
          p_channel_id?: number
          p_create_if_not_exists?: boolean
          p_price_list_id?: number
          p_sale_type_id?: number
          p_stock_type_id?: number
          p_user_id?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_get_categories_product_count: {
        Args: {
          p_description?: boolean
          p_image?: boolean
          p_max_products?: number
          p_min_products?: number
          p_order?: string
          p_page?: number
          p_parentcategory?: boolean
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_categories_selector: {
        Args: {
          p_ids?: number[]
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_complaint_by_id: { Args: { p_id: number }; Returns: Json }
      sp_get_complaint_notes: {
        Args: { p_complaints_book_id: number }
        Returns: Json
      }
      sp_get_complaints_book: {
        Args: {
          p_page?: number
          p_search?: string
          p_size?: number
          p_status?: string
        }
        Returns: Json
      }
      sp_get_complaints_book_export: {
        Args: { p_search?: string; p_status?: string }
        Returns: Json
      }
      sp_get_customer_points: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_dashboard: { Args: never; Returns: Json }
      sp_get_document_products: {
        Args: { p_order_id?: number; p_return_id?: number }
        Returns: Json
      }
      sp_get_explosion_by_id: { Args: { p_id: number }; Returns: Json }
      sp_get_explosions: {
        Args: {
          p_category_id?: number
          p_page?: number
          p_product_id?: number
          p_search?: string
          p_size?: number
          p_variation_id?: number
          p_without_variation?: boolean
        }
        Returns: Json
      }
      sp_get_franchise_products:
        | {
            Args: {
              p_franchisee_only?: boolean
              p_page?: number
              p_search?: string
              p_size?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_date_from?: string
              p_date_to?: string
              p_franchisee_only?: boolean
              p_page?: number
              p_search?: string
              p_size?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_date_from?: string
              p_date_to?: string
              p_franchisee_only?: boolean
              p_page?: number
              p_payment_statuses?: string[]
              p_search?: string
              p_size?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_date_from?: string
              p_date_to?: string
              p_franchisee_only?: boolean
              p_page?: number
              p_payment_statuses?: string[]
              p_sales_status?: string
              p_search?: string
              p_size?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_account_ids?: number[]
              p_category_ids?: number[]
              p_date_from?: string
              p_date_to?: string
              p_franchisee_only?: boolean
              p_order_id?: number
              p_page?: number
              p_payment_statuses?: string[]
              p_sales_status?: string
              p_search?: string
              p_size?: number
              p_stock_status?: string
            }
            Returns: Json
          }
      sp_get_guia_for_emit: { Args: { p_invoice_id: number }; Returns: Json }
      sp_get_inventory: {
        Args: {
          p_max_stock?: number
          p_min_stock?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_types?: number
          p_warehouse?: number
        }
        Returns: Json
      }
      sp_get_invoice_for_emit: { Args: { p_invoice_id: number }; Returns: Json }
      sp_get_invoices:
        | {
            Args: {
              p_declared?: boolean
              p_end_date?: string
              p_max_mount?: number
              p_min_mount?: number
              p_order?: string
              p_page?: number
              p_search?: string
              p_size?: number
              p_start_date?: string
              p_type?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_declared?: boolean
              p_max_mount?: number
              p_min_mount?: number
              p_order?: string
              p_page?: number
              p_search?: string
              p_size?: number
              p_type?: number
            }
            Returns: Json
          }
      sp_get_invoices_series: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_list_orders: {
        Args: {
          p_channel?: number
          p_maxfecha?: string
          p_maxtotal?: number
          p_minfecha?: string
          p_mintotal?: number
          p_page?: number
          p_search?: string
          p_size?: number
          p_status?: number
        }
        Returns: Json
      }
      sp_get_material_dispatch_guide: {
        Args: { p_movement_id: number }
        Returns: Json
      }
      sp_get_material_dispatch_plan: {
        Args: {
          p_destination_warehouse_id?: number
          p_production_order_id: number
          p_supplier_quotation_id?: number
          p_supplier_service_id?: number
        }
        Returns: Json
      }
      sp_get_material_inventory: {
        Args: {
          p_material_id?: number
          p_max_stock?: number
          p_min_stock?: number
          p_order?: string
          p_owner?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_stock_type_id?: number
          p_supplier_id?: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_get_material_price_history: {
        Args: { p_material_id: number; p_page?: number; p_size?: number }
        Returns: Json
      }
      sp_get_material_stock_movements: {
        Args: {
          p_completed?: boolean
          p_end_date?: string
          p_in_out?: boolean
          p_material_class_id?: number
          p_material_id?: number
          p_movement_type_id?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_start_date?: string
          p_stock_type_id?: number
          p_user?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_get_materials: {
        Args: {
          p_material_class_id?: number
          p_material_id?: number
          p_page?: number
          p_search?: string
          p_size?: number
          p_supplier_id?: number
        }
        Returns: Json
      }
      sp_get_movements: {
        Args: {
          p_branches?: number
          p_bussines_account?: number
          p_class?: number
          p_end_date?: string
          p_order?: string
          p_page?: number
          p_payment_method?: number
          p_sale_type?: string
          p_search?: string
          p_size?: number
          p_start_date?: string
          p_type?: number
        }
        Returns: Json
      }
      sp_get_my_notifications: {
        Args: {
          p_before_created_at?: string
          p_before_id?: number
          p_limit?: number
        }
        Returns: Json
      }
      sp_get_order_chanel_type: {
        Args: { p_page: number; p_size: number }
        Returns: Json
      }
      sp_get_order_notes: { Args: { p_order_id: number }; Returns: Json }
      sp_get_payment_method_details: { Args: { p_id: number }; Returns: Json }
      sp_get_payments_methods: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_permissions: { Args: never; Returns: Json }
      sp_get_pos_session_close_details: {
        Args: { p_business_account_id: number; p_opened_at: string }
        Returns: Json
      }
      sp_get_price_list: {
        Args: { p_page?: number; p_size?: number }
        Returns: Json
      }
      sp_get_price_list_details: { Args: { p_id: number }; Returns: Json }
      sp_get_price_rule_details: { Args: { p_id: number }; Returns: Json }
      sp_get_process_groups: {
        Args: {
          p_is_active?: boolean
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_processes: {
        Args: {
          p_is_active?: boolean
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_production_order_by_id: { Args: { p_id: number }; Returns: Json }
      sp_get_production_order_item_info: {
        Args: { p_production_order_id: number }
        Returns: Json
      }
      sp_get_production_order_material_requirement: {
        Args: { p_production_order_id: number }
        Returns: Json
      }
      sp_get_production_order_processes: {
        Args: { p_production_order_id: number }
        Returns: Json
      }
      sp_get_production_order_purchases: {
        Args: { p_production_order_id: number }
        Returns: Json
      }
      sp_get_production_order_quotation_options: {
        Args: { p_production_order_id: number }
        Returns: Json
      }
      sp_get_production_order_service_options: {
        Args: { p_production_order_id: number }
        Returns: Json
      }
      sp_get_production_order_step_dates: {
        Args: { p_production_order_id: number }
        Returns: Json
      }
      sp_get_production_orders: {
        Args: {
          p_page?: number
          p_production_order_class_id?: number
          p_search?: string
          p_size?: number
          p_type?: string
        }
        Returns: Json
      }
      sp_get_production_plan: {
        Args: {
          p_category_id?: number
          p_page?: number
          p_production_order_class_id?: number
          p_production_order_id?: number
          p_production_order_status?: string
          p_promised_from?: string
          p_promised_to?: string
          p_search?: string
          p_size?: number
          p_status?: string
        }
        Returns: Json
      }
      sp_get_products_costs: {
        Args: {
          p_category?: number
          p_cost?: boolean
          p_max_cost?: number
          p_min_cost?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_variation?: number
        }
        Returns: Json
      }
      sp_get_products_selector: {
        Args: {
          p_ids?: number[]
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_quotation_consumptions: {
        Args: { p_quotation_id: number }
        Returns: Json
      }
      sp_get_quotation_services: {
        Args: {
          p_kind?: string
          p_page?: number
          p_quotation_id: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_quotations_list: {
        Args: {
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_reclamacion_by_id: { Args: { p_id: number }; Returns: Json }
      sp_get_reclamaciones: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_return_details: { Args: { p_return_id: number }; Returns: Json }
      sp_get_return_order_and_return: {
        Args: {
          p_branch_id?: number
          p_end_date?: string
          p_order: boolean
          p_order_by?: string
          p_page?: number
          p_return: boolean
          p_return_type_code?: string
          p_sale_type?: number
          p_search?: string
          p_situation_id?: number
          p_size?: number
          p_start_date?: string
          p_status?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_get_returns: {
        Args: {
          p_end_date?: string
          p_maxtotal?: number
          p_mintotal?: number
          p_page?: number
          p_search?: string
          p_size?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_get_role_by_id: { Args: { p_role_id: number }; Returns: Json }
      sp_get_roles: {
        Args: {
          p_is_admin?: boolean
          p_max_user?: number
          p_min_user?: number
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_sale_by_id: { Args: { p_order_id: number }; Returns: Json }
      sp_get_sale_by_id_products: {
        Args: { p_order_id: number }
        Returns: Json
      }
      sp_get_sale_products: {
        Args: {
          p_page?: number
          p_search?: string
          p_size?: number
          p_stock_type_id?: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_get_sales_list:
        | {
            Args: {
              p_branch_id?: number
              p_end_date?: string
              p_order?: string
              p_page?: number
              p_sale_type?: number
              p_search?: string
              p_situation_id?: number
              p_size?: number
              p_start_date?: string
              p_status?: string
              p_warehouse_id?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_branch_id?: number
              p_consignament?: boolean
              p_end_date?: string
              p_order?: string
              p_page?: number
              p_sale_type?: number
              p_search?: string
              p_situation_id?: number
              p_size?: number
              p_start_date?: string
              p_status?: string
              p_warehouse_id?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_branch_id?: number
              p_consignament?: boolean
              p_end_date?: string
              p_order?: string
              p_page?: number
              p_payment_status?: string
              p_sale_type?: number
              p_search?: string
              p_situation_id?: number
              p_size?: number
              p_start_date?: string
              p_status?: string
              p_warehouse_id?: number
            }
            Returns: Json
          }
      sp_get_shipping_methods: {
        Args: {
          p_cities?: number
          p_countries?: number
          p_max_cost?: number
          p_min_cost?: number
          p_neighborhoods?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_states?: number
        }
        Returns: Json
      }
      sp_get_stock_byvariation_and_type: {
        Args: {
          p_product_variation_id?: number
          p_stock_type_id?: number
          p_warehouse_id?: number
        }
        Returns: number
      }
      sp_get_stock_movements: {
        Args: {
          p_completed?: boolean
          p_end_date?: string
          p_in_out?: boolean
          p_order?: string
          p_origin?: number
          p_page?: number
          p_search?: string
          p_size?: number
          p_start_date?: string
          p_user?: number
          p_warehouse?: number
        }
        Returns: Json
      }
      sp_get_stock_types: {
        Args: { p_page?: number; p_size?: number }
        Returns: Json
      }
      sp_get_supplier_payments: {
        Args: {
          p_page?: number
          p_search?: string
          p_service_id?: number
          p_size?: number
          p_status?: string
          p_supplier_id?: number
        }
        Returns: Json
      }
      sp_get_supplier_service_variation_options: {
        Args: { p_search?: string }
        Returns: Json
      }
      sp_get_supplier_services: {
        Args: {
          p_kind?: string
          p_material_id?: number
          p_page?: number
          p_production_order_id?: number
          p_promised_from?: string
          p_promised_to?: string
          p_search?: string
          p_situation_id?: number
          p_size?: number
          p_supplier_class_id?: number
          p_supplier_quotation_id?: number
          p_variation_id?: number
        }
        Returns: Json
      }
      sp_get_supplier_warehouse_options: {
        Args: { p_supplier_id: number }
        Returns: Json
      }
      sp_get_suppliers: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_tags: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_tenant_subscription: { Args: never; Returns: Json }
      sp_get_terms: {
        Args: {
          p_group?: number
          p_max_pr?: number
          p_min_pr?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_get_terms_by_category: {
        Args: { p_category_id?: number }
        Returns: Json
      }
      sp_get_user_details_by_uid: { Args: { p_uid: string }; Returns: Json }
      sp_get_user_permissions: { Args: never; Returns: Json }
      sp_get_user_views: { Args: never; Returns: Json }
      sp_get_users: {
        Args: {
          p_branches?: number
          p_order?: string
          p_page?: number
          p_person_type?: number
          p_role?: number
          p_search?: string
          p_show?: boolean
          p_size?: number
          p_warehouses?: number
        }
        Returns: Json
      }
      sp_get_variations_min_stock: {
        Args: {
          p_brand_id?: number
          p_category_ids?: number[]
          p_channel_id?: number
          p_max_price?: number
          p_maxstock?: number
          p_min_price?: number
          p_minstock?: number
          p_order?: string
          p_page?: number
          p_search?: string
          p_size?: number
          p_status?: boolean
          p_tag_id?: number
          p_term_id?: number
          p_web?: boolean
        }
        Returns: Json
      }
      sp_get_visual_edits: {
        Args: {
          p_end_date?: string
          p_page?: number
          p_size?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_get_warehouses: {
        Args: {
          p_branches?: number
          p_cities?: number
          p_countries?: number
          p_neighborhoods?: number
          p_page?: number
          p_search?: string
          p_size?: number
          p_states?: number
        }
        Returns: Json
      }
      sp_insert_invoices_gre: {
        Args: {
          p_conductor_apellidos: string
          p_conductor_dni: string
          p_conductor_licencia: string
          p_conductor_nombre: string
          p_fecha_traslado: string
          p_id: number
          p_llegada_direccion: string
          p_llegada_ubigeo: string
          p_motivo_traslado: string
          p_numero_bultos: number
          p_partida_direccion: string
          p_partida_ubigeo: string
          p_peso_bruto_total: number
          p_peso_unidad: string
          p_placa: string
          p_tipo_transporte: string
          p_transportista_nombre: string
          p_transportista_ruc: string
        }
        Returns: undefined
      }
      sp_link_services_to_production_order: {
        Args: {
          p_production_order_id: number
          p_supplier_service_ids: number[]
        }
        Returns: Json
      }
      sp_mark_all_notifications_read: { Args: never; Returns: undefined }
      sp_mark_notification_read: {
        Args: { p_notification_id: number }
        Returns: undefined
      }
      sp_open_pos_session: {
        Args: {
          p_branch_id: number
          p_business_account_id: number
          p_notes: string
          p_opening_amount: number
          p_sale_type_id?: number
          p_user_id: string
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_recalculate_supplier_quotation_totals: {
        Args: { p_quotation_id: number }
        Returns: Json
      }
      sp_receive_production_order: {
        Args: {
          p_bad_stock_type_id?: number
          p_bad_warehouse_id?: number
          p_items?: Json
          p_production_order_id: number
          p_stock_type_id?: number
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_rpt_cashflow_over_time: {
        Args: {
          p_branch_id?: number
          p_business_account?: number
          p_end_date?: string
          p_granularity?: string
          p_movement_class_id?: number
          p_payment_method_id?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_rpt_customers_by_branch: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_by_loyalty: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_by_sale_type: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_geo_distribution: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_kpis: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_new_vs_returning: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_pareto: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_purchase_frequency: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_recency: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_customers_upcoming_birthdays: {
        Args: { p_days?: number; p_limit?: number }
        Returns: Json
      }
      sp_rpt_dead_stock: {
        Args: {
          p_days?: number
          p_page?: number
          p_size?: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_customers: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_financial_movements: {
        Args: {
          p_branch_id?: number
          p_business_account?: number
          p_end_date?: string
          p_movement_class_id?: number
          p_payment_method_id?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_rpt_export_inventory: {
        Args: {
          p_price_list_id?: number
          p_threshold?: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_products_by_category: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_products_by_product: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_returns: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_return_situation_ids?: number[]
          p_return_type_ids?: number[]
          p_sale_type_id?: number
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_sales: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_sales_detail: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_export_sellers_orders: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_financial_accounts_balances: { Args: never; Returns: Json }
      sp_rpt_financial_by_branch: {
        Args: {
          p_branch_id?: number
          p_business_account?: number
          p_end_date?: string
          p_movement_class_id?: number
          p_payment_method_id?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_rpt_financial_by_class: {
        Args: {
          p_branch_id?: number
          p_business_account?: number
          p_end_date?: string
          p_movement_class_id?: number
          p_payment_method_id?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_rpt_financial_by_payment_method: {
        Args: {
          p_branch_id?: number
          p_business_account?: number
          p_end_date?: string
          p_movement_class_id?: number
          p_payment_method_id?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_rpt_financial_kpis: {
        Args: {
          p_branch_id?: number
          p_business_account?: number
          p_end_date?: string
          p_movement_class_id?: number
          p_payment_method_id?: number
          p_start_date?: string
        }
        Returns: Json
      }
      sp_rpt_financial_margin_by_product: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_limit?: number
          p_neighborhood_id?: number
          p_only_active_products?: boolean
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_financial_profit_kpis: {
        Args: {
          p_branch_id?: number
          p_end_date?: string
          p_payment_method_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
        }
        Returns: Json
      }
      sp_rpt_inventory_summary: {
        Args: { p_low_stock_threshold?: number; p_warehouse_id?: number }
        Returns: Json
      }
      sp_rpt_inventory_valuation: {
        Args: { p_price_list_id?: number; p_warehouse_id?: number }
        Returns: Json
      }
      sp_rpt_low_stock_distribution: {
        Args: { p_threshold?: number; p_warehouse_id?: number }
        Returns: Json
      }
      sp_rpt_low_stock_products: {
        Args: {
          p_page?: number
          p_search?: string
          p_size?: number
          p_threshold?: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_rpt_price_rules_report: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_product_detail: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_product_id: number
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_product_search: {
        Args: { p_limit?: number; p_query?: string }
        Returns: Json
      }
      sp_rpt_products_by_category: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_products_category_over_time: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_granularity?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_products_kpis: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_products_pareto: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_limit?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_products_sales_by_size: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_returns_by_reason: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_return_situation_ids?: number[]
          p_return_type_ids?: number[]
          p_sale_type_id?: number
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_returns_by_type: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_return_situation_ids?: number[]
          p_return_type_ids?: number[]
          p_sale_type_id?: number
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_returns_kpis: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_return_situation_ids?: number[]
          p_return_type_ids?: number[]
          p_sale_type_id?: number
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_returns_over_time: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_granularity?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_return_situation_ids?: number[]
          p_return_type_ids?: number[]
          p_sale_type_id?: number
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sales_by_dimension: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_dimension?: string
          p_end_date?: string
          p_max_total?: number
          p_min_total?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_product_id?: number
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sales_geo_heatmap: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_map_city_id?: number
          p_map_state_id?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sales_kpis: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_max_total?: number
          p_min_total?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_product_id?: number
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sales_over_time: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_granularity?: string
          p_max_total?: number
          p_min_total?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_product_id?: number
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sellers_by_branch: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sellers_kpis: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sellers_over_time: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_granularity?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_sellers_summary: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_stock_by_category: {
        Args: { p_warehouse_id?: number }
        Returns: Json
      }
      sp_rpt_stock_by_term_group: {
        Args: { p_term_group_id?: number; p_warehouse_id?: number }
        Returns: Json
      }
      sp_rpt_stock_flow_over_time: {
        Args: {
          p_end_date?: string
          p_granularity?: string
          p_start_date?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_rpt_stock_movement_types: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_rpt_stock_rotation: {
        Args: {
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_rpt_top_customers: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_limit?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_top_products_by_category: {
        Args: {
          p_branch_id?: number
          p_category_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_limit?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_top_products_sales: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_limit?: number
          p_metric?: string
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_sale_type_id?: number
          p_situation_ids?: number[]
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_rpt_top_returned_products: {
        Args: {
          p_branch_id?: number
          p_city_id?: number
          p_country_id?: number
          p_end_date?: string
          p_limit?: number
          p_neighborhood_id?: number
          p_payment_method_id?: number
          p_price_list_code?: string
          p_return_situation_ids?: number[]
          p_return_type_ids?: number[]
          p_sale_type_id?: number
          p_start_date?: string
          p_state_id?: number
        }
        Returns: Json
      }
      sp_save_role: {
        Args: {
          p_admin?: boolean
          p_name: string
          p_permission_ids?: number[]
          p_role_id?: number
        }
        Returns: Json
      }
      sp_search_barcode_movements: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_search_barcode_variations: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_set_complaint_status: {
        Args: { p_id: number; p_status: string }
        Returns: Json
      }
      sp_set_production_order_step_dates: {
        Args: { p_production_order_id: number; p_rows?: Json }
        Returns: Json
      }
      sp_set_quotation_consumptions: {
        Args: {
          p_material_ids?: number[]
          p_quotation_id: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_set_role_permissions: {
        Args: { p_permission_ids: number[]; p_role_id: number }
        Returns: Json
      }
      sp_set_supplier_classes: {
        Args: { p_class_ids?: number[]; p_supplier_id: number }
        Returns: Json
      }
      sp_unlink_service_from_production_order: {
        Args: { p_production_order_id: number; p_supplier_service_id: number }
        Returns: Json
      }
      sp_update_accounts_zero: {
        Args: {
          p_document_number: string
          p_document_type_id: number
          p_last_name?: string
          p_last_name2?: string
          p_middle_name?: string
          p_name: string
          p_profile_uid?: string
        }
        Returns: Json
      }
      sp_update_business_account: {
        Args: {
          p_account_branch_id?: number
          p_account_number: number
          p_bank: string
          p_branch_id: number
          p_business_account_type_id: number
          p_id: number
          p_name: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_update_explosion: {
        Args: {
          p_description?: string
          p_id: number
          p_materials?: Json
          p_model_code?: string
          p_variation_ids?: number[]
        }
        Returns: Json
      }
      sp_update_invoice_sunat_response:
        | {
            Args: {
              p_cdr_url?: string
              p_declared?: boolean
              p_invoice_id: number
              p_invoice_number?: string
              p_pdf_url?: string
              p_qr_data?: string
              p_xml_url?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_cdr_url?: string
              p_declared?: boolean
              p_invoice_id: number
              p_pdf_url?: string
              p_xml_url?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_cdr_url?: string
              p_declared?: boolean
              p_invoice_id: number
              p_invoice_number?: string
              p_pdf_url?: string
              p_xml_url?: string
            }
            Returns: undefined
          }
      sp_update_order_chanel_type: {
        Args: {
          p_code: string
          p_id: number
          p_module_code?: string
          p_module_id?: number
          p_name: string
          p_payment_methods?: number[]
        }
        Returns: Json
      }
      sp_update_order_situation: {
        Args: { p_order_id: number; p_refund?: Json; p_situation_id: number }
        Returns: Json
      }
      sp_update_payment_method: {
        Args: {
          p_active?: boolean
          p_business_account_id?: number
          p_id: number
          p_name?: string
        }
        Returns: Json
      }
      sp_update_price_list: {
        Args: { p_code: string; p_id: number; p_name: string }
        Returns: Json
      }
      sp_update_process: {
        Args: {
          p_code?: string
          p_id: number
          p_name?: string
          p_process_group_id?: number
        }
        Returns: Json
      }
      sp_update_process_group: {
        Args: { p_code?: string; p_id: number; p_name?: string }
        Returns: Json
      }
      sp_update_product:
        | {
            Args: {
              p_description: string
              p_exhibition_end_date?: string
              p_exhibition_start_date?: string
              p_is_active: boolean
              p_is_variable: boolean
              p_is_web: boolean
              p_product_id: number
              p_product_images: Json
              p_product_name: string
              p_promotional_bg_color?: string
              p_promotional_text?: string
              p_promotional_text_color?: string
              p_reset_variations?: boolean
              p_selected_brands?: number[]
              p_selected_categories: number[]
              p_selected_tags?: number[]
              p_short_description: string
              p_sizes_image_url?: string
              p_user_id?: string
              p_variations: Json
            }
            Returns: Record<string, unknown>
          }
        | {
            Args: {
              p_description: string
              p_exhibition_end_date?: string
              p_exhibition_start_date?: string
              p_is_active: boolean
              p_is_variable: boolean
              p_product_id: number
              p_product_images: Json
              p_product_name: string
              p_reset_variations: boolean
              p_selected_categories: number[]
              p_selected_tags?: number[]
              p_short_description: string
              p_user_id: string
              p_variations: Json
            }
            Returns: Record<string, unknown>
          }
      sp_update_production_order: {
        Args: {
          p_description?: string
          p_expected_updated_at?: string
          p_finish_date?: string
          p_id: number
          p_items?: Json
          p_name?: string
          p_production_order_class_id?: number
          p_promised_date?: string
          p_set_finish_date?: boolean
          p_set_promised_date?: boolean
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_update_production_order_item_info: {
        Args: { p_production_order_id: number; p_rows?: Json }
        Returns: Json
      }
      sp_update_production_order_processes: {
        Args: { p_production_order_id: number; p_rows: Json }
        Returns: Json
      }
      sp_update_return: {
        Args: { p_payload: Json; p_user_id: string }
        Returns: Json
      }
      sp_update_service_situation: {
        Args: {
          p_bad_quantity?: number
          p_created_at?: string
          p_items?: Json
          p_measurement_unit: string
          p_message?: string
          p_module_id: number
          p_price?: number
          p_price_includes_tax?: boolean
          p_quantity?: number
          p_situation_id: number
          p_status_id: number
          p_supplier_service_id: number
          p_supplier_service_situation_id: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_update_stock_type: {
        Args: { p_code: string; p_id: number; p_name: string }
        Returns: Json
      }
      sp_update_supplier_quotation_notes: {
        Args: {
          p_currency?: string
          p_id: number
          p_payment_terms?: string
          p_request_description?: string
        }
        Returns: Json
      }
      sp_update_supplier_service: {
        Args: {
          p_clear_material?: boolean
          p_code?: string
          p_description?: string
          p_id: number
          p_material_id?: number
          p_new_material?: Json
          p_promised_date?: string
          p_received_date?: string
          p_start_at?: string
          p_supplier_class_id?: number
          p_supplier_quotation_id?: number
          p_warehouse_id?: number
        }
        Returns: Json
      }
      sp_validate_erp_access: { Args: never; Returns: Json }
      tenant_allowed_permission_ids: { Args: never; Returns: number[] }
      tenant_subscription_ids: { Args: never; Returns: number[] }
      unaccent: { Args: { "": string }; Returns: string }
      update_stock_movement_request: {
        Args: {
          p_created_by: string
          p_items_approval?: Json
          p_message?: string
          p_module_code: string
          p_request_id: number
          p_situation_code: string
        }
        Returns: Json
      }
    }
    Enums: {
      permission_type_enum: "component" | "route"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      permission_type_enum: ["component", "route"],
    },
  },
} as const

