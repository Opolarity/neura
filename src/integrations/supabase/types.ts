export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
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
          id: number
          is_active: boolean
          last_name: string | null
          last_name2: string | null
          middle_name: string | null
          name: string
          show: boolean
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type_id: number
          id?: number
          is_active?: boolean
          last_name?: string | null
          last_name2?: string | null
          middle_name?: string | null
          name: string
          show?: boolean
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type_id?: number
          id?: number
          is_active?: boolean
          last_name?: string | null
          last_name2?: string | null
          middle_name?: string | null
          name?: string
          show?: boolean
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
          business_account_type_id: number
          created_at: string
          id: number
          name: string
          total_amount: number
        }
        Insert: {
          account_id?: number
          account_number?: number | null
          bank: string
          business_account_type_id: number
          created_at?: string
          id?: number
          name: string
          total_amount: number
        }
        Update: {
          account_id?: number
          account_number?: number | null
          bank?: string
          business_account_type_id?: number
          created_at?: string
          id?: number
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
      cart_products: {
        Row: {
          bought: boolean
          cart_id: number
          id: number
          product_discount: number | null
          product_price: number
          product_variation_id: number
          quantity: number
          warehouse_id: number | null
        }
        Insert: {
          bought?: boolean
          cart_id: number
          id?: number
          product_discount?: number | null
          product_price: number
          product_variation_id: number
          quantity: number
          warehouse_id?: number | null
        }
        Update: {
          bought?: boolean
          cart_id?: number
          id?: number
          product_discount?: number | null
          product_price?: number
          product_variation_id?: number
          quantity?: number
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
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
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
          name: string
          parent_category: number | null
        }
        Insert: {
          description?: string | null
          id?: number
          image_url?: string | null
          name: string
          parent_category?: number | null
        }
        Update: {
          description?: string | null
          id?: number
          image_url?: string | null
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
      cities: {
        Row: {
          country_id: number
          created_at: string
          id: number
          name: string
          state_id: number
        }
        Insert: {
          country_id: number
          created_at?: string
          id?: number
          name: string
          state_id: number
        }
        Update: {
          country_id?: number
          created_at?: string
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
            foreignKeyName: "classes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string
          id: number
          name: string
          phone_code: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          phone_code?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          phone_code?: string | null
        }
        Relationships: []
      }
      customer_profile: {
        Row: {
          account_id: number
          activity: string | null
          amount_spent: number | null
          id: number
          orders_quantity: number | null
          points: number | null
        }
        Insert: {
          account_id: number
          activity?: string | null
          amount_spent?: number | null
          id?: number
          orders_quantity?: number | null
          points?: number | null
        }
        Update: {
          account_id?: number
          activity?: string | null
          amount_spent?: number | null
          id?: number
          orders_quantity?: number | null
          points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_profile_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
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
      functions: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          icon: string | null
          id: number
          location: string | null
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
          location?: string | null
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
          location?: string | null
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
      invoice_series: {
        Row: {
          account_id: number
          created_at: string
          id: number
          invoice_type_id: number
          is_active: boolean
          next_number: number
          tax_serie: string
          user_id: string
        }
        Insert: {
          account_id: number
          created_at?: string
          id?: number
          invoice_type_id: number
          is_active?: boolean
          next_number: number
          tax_serie: string
          user_id?: string
        }
        Update: {
          account_id?: number
          created_at?: string
          id?: number
          invoice_type_id?: number
          is_active?: boolean
          next_number?: number
          tax_serie?: string
          user_id?: string
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
            foreignKeyName: "invoice_series_invoice_type_id_fkey"
            columns: ["invoice_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_series_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["UID"]
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
          customer_document_number: string
          customer_document_type_id: number
          declared: boolean
          id: number
          invoice_type_id: number
          pdf_url: string | null
          tax_serie: string | null
          total_amount: number
          total_free: number | null
          total_others: number | null
          total_taxes: number | null
          xml_url: string | null
        }
        Insert: {
          cdr_url?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string
          customer_document_number?: string
          customer_document_type_id?: number
          declared?: boolean
          id?: number
          invoice_type_id: number
          pdf_url?: string | null
          tax_serie?: string | null
          total_amount: number
          total_free?: number | null
          total_others?: number | null
          total_taxes?: number | null
          xml_url?: string | null
        }
        Update: {
          cdr_url?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string
          customer_document_number?: string
          customer_document_type_id?: number
          declared?: boolean
          id?: number
          invoice_type_id?: number
          pdf_url?: string | null
          tax_serie?: string | null
          total_amount?: number
          total_free?: number | null
          total_others?: number | null
          total_taxes?: number | null
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
      movements: {
        Row: {
          amount: number
          branch_id: number
          business_account_id: number
          created_at: string
          description: string | null
          id: number
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
          created_at?: string
          description?: string | null
          id?: number
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
          created_at?: string
          description?: string | null
          id?: number
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
          id: number
          name: string
          state_id: number
        }
        Insert: {
          city_id: number
          country_id: number
          created_at?: string
          id?: number
          name: string
          state_id: number
        }
        Update: {
          city_id?: number
          country_id?: number
          created_at?: string
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
      notes: {
        Row: {
          code: string | null
          created_at: string
          id: number
          image_url: string | null
          message: string | null
          user_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          message?: string | null
          user_id?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          message?: string | null
          user_id?: string
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
        ]
      }
      order_payment: {
        Row: {
          amount: number
          date: string
          gateway_confirmation_code: string | null
          id: number
          movement_id: number
          order_id: number
          payment_method_id: number
          voucher_url: string | null
        }
        Insert: {
          amount: number
          date: string
          gateway_confirmation_code?: string | null
          id?: number
          movement_id: number
          order_id: number
          payment_method_id: number
          voucher_url?: string | null
        }
        Update: {
          amount?: number
          date?: string
          gateway_confirmation_code?: string | null
          id?: number
          movement_id?: number
          order_id?: number
          payment_method_id?: number
          voucher_url?: string | null
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
            foreignKeyName: "fk_order_payment_payment_method_id_payment_methods_id"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
        ]
      }
      order_products: {
        Row: {
          id: number
          order_id: number
          product_discount: number
          product_name: string | null
          product_price: number
          product_variation_id: number
          quantity: number
          stock_movement_id: number
          warehouses_id: number
        }
        Insert: {
          id?: number
          order_id: number
          product_discount?: number
          product_name?: string | null
          product_price: number
          product_variation_id: number
          quantity: number
          stock_movement_id?: number
          warehouses_id?: number
        }
        Update: {
          id?: number
          order_id?: number
          product_discount?: number
          product_name?: string | null
          product_price?: number
          product_variation_id?: number
          quantity?: number
          stock_movement_id?: number
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
          created_by: string
          id: number
          last_row: boolean
          order_id: number
          situation_id: number
          status_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          last_row: boolean
          order_id: number
          situation_id: number
          status_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
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
          city_id: number | null
          country_id: number | null
          created_at: string
          customer_lastname: string | null
          customer_name: string | null
          date: string | null
          discount: number
          document_number: string
          document_type: number
          email: string | null
          id: number
          neighborhood_id: number | null
          phone: number | null
          price_list_code: string
          reception_person: string | null
          reception_phone: number | null
          sale_type_id: number
          shipping_cost: number | null
          shipping_method_code: string | null
          state_id: number | null
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_reference?: string | null
          branch_id?: number | null
          city_id?: number | null
          country_id?: number | null
          created_at?: string
          customer_lastname?: string | null
          customer_name?: string | null
          date?: string | null
          discount?: number
          document_number: string
          document_type: number
          email?: string | null
          id?: number
          neighborhood_id?: number | null
          phone?: number | null
          price_list_code?: string
          reception_person?: string | null
          reception_phone?: number | null
          sale_type_id: number
          shipping_cost?: number | null
          shipping_method_code?: string | null
          state_id?: number | null
          subtotal: number
          total: number
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_reference?: string | null
          branch_id?: number | null
          city_id?: number | null
          country_id?: number | null
          created_at?: string
          customer_lastname?: string | null
          customer_name?: string | null
          date?: string | null
          discount?: number
          document_number?: string
          document_type?: number
          email?: string | null
          id?: number
          neighborhood_id?: number | null
          phone?: number | null
          price_list_code?: string
          reception_person?: string | null
          reception_phone?: number | null
          sale_type_id?: number
          shipping_cost?: number | null
          shipping_method_code?: string | null
          state_id?: number | null
          subtotal?: number
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
            referencedRelation: "types"
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
      payment_methods: {
        Row: {
          active: boolean
          business_account_id: number | null
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          active: boolean
          business_account_id?: number | null
          id?: number
          is_active?: boolean
          name: string
        }
        Update: {
          active?: boolean
          business_account_id?: number | null
          id?: number
          is_active?: boolean
          name?: string
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
          status_id: number
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
          status_id: number
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
          status_id?: number
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
          location: number
          name: string
          web: boolean
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean
          location?: number
          name: string
          web?: boolean
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean
          location?: number
          name?: string
          web?: boolean
        }
        Relationships: []
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
          id: number
          product_id: number
          tag_id: number
        }
        Insert: {
          id?: number
          product_id: number
          tag_id: number
        }
        Update: {
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
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: number
          is_active: boolean | null
          is_variable: boolean
          short_description: string
          title: string
          web: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_variable: boolean
          short_description?: string
          title: string
          web?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_variable?: boolean
          short_description?: string
          title?: string
          web?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: number
          address: string | null
          address_reference: string | null
          branch_id: number
          city_id: number | null
          country_id: number | null
          created_at: string | null
          is_active: boolean
          neighborhood_id: number | null
          state_id: number | null
          UID: string
          warehouse_id: number
        }
        Insert: {
          account_id: number
          address?: string | null
          address_reference?: string | null
          branch_id: number
          city_id?: number | null
          country_id?: number | null
          created_at?: string | null
          is_active: boolean
          neighborhood_id?: number | null
          state_id?: number | null
          UID: string
          warehouse_id?: number
        }
        Update: {
          account_id?: number
          address?: string | null
          address_reference?: string | null
          branch_id?: number
          city_id?: number | null
          country_id?: number | null
          created_at?: string | null
          is_active?: boolean
          neighborhood_id?: number | null
          state_id?: number | null
          UID?: string
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
          reason: string | null
          return_id: number | null
          return_type_id: number
          shipping_return: boolean
          situation_id: number
          status_id: number
          total_exchange_difference: number | null
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
          reason?: string | null
          return_id?: number | null
          return_type_id: number
          shipping_return?: boolean
          situation_id: number
          status_id: number
          total_exchange_difference?: number | null
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
          reason?: string | null
          return_id?: number | null
          return_type_id?: number
          shipping_return?: boolean
          situation_id?: number
          status_id?: number
          total_exchange_difference?: number | null
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
            foreignKeyName: "returns_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
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
          output: boolean
          product_amount: number | null
          product_variation_id: number
          quantity: number
          return_id: number
          stock_movement_id: number
          vinculated_return_product_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          output?: boolean
          product_amount?: number | null
          product_variation_id: number
          quantity: number
          return_id: number
          stock_movement_id: number
          vinculated_return_product_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: never
          output?: boolean
          product_amount?: number | null
          product_variation_id?: number
          quantity?: number
          return_id?: number
          stock_movement_id?: number
          vinculated_return_product_id?: number | null
        }
        Relationships: [
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
            foreignKeyName: "returns_products_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_products_vinculated_return_product_id_fkey"
            columns: ["vinculated_return_product_id"]
            isOneToOne: false
            referencedRelation: "returns_products"
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
      sale_types: {
        Row: {
          created_at: string
          id: number
          is_manual: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_manual?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          is_manual?: boolean
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
          id: number
          name: string
        }
        Insert: {
          country_id: number
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          country_id?: number
          created_at?: string
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
        ]
      }
      stock_movement_requests: {
        Row: {
          created_at: string
          created_by: string
          id: number
          in_warehouse_id: number | null
          module_id: number
          out_warehouse_id: number
          reason: string | null
          situation_id: number
          status_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          in_warehouse_id?: number | null
          module_id: number
          out_warehouse_id: number
          reason?: string | null
          situation_id: number
          status_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          in_warehouse_id?: number | null
          module_id?: number
          out_warehouse_id?: number
          reason?: string | null
          situation_id?: number
          status_id?: number
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
            foreignKeyName: "stock_movement_requests_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_requests_out_warehouse_id_fkey"
            columns: ["out_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_requests_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_requests_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          completed: boolean
          created_at: string | null
          created_by: string
          id: number
          is_active: boolean
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
          created_by: string
          id?: never
          is_active?: boolean
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
          created_by?: string
          id?: never
          is_active?: boolean
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
      supplier_classes: {
        Row: {
          id: number
          spplier_class_id: number
          supplier_id: number
        }
        Insert: {
          id?: number
          spplier_class_id: number
          supplier_id: number
        }
        Update: {
          id?: number
          spplier_class_id?: number
          supplier_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_types_spplier_class_id_fkey"
            columns: ["spplier_class_id"]
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
      supplier_quotations_payments: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: number
          movement_id: number
          payment_method_id: number
          supplier_quotation_id: number
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
        ]
      }
      supplier_service_quotations: {
        Row: {
          created_at: string
          created_by: string
          id: number
          price: number | null
          quantity: number | null
          request_description: string
          supplier_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: number
          price?: number | null
          quantity?: number | null
          request_description: string
          supplier_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          price?: number | null
          quantity?: number | null
          request_description?: string
          supplier_id?: number
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
          id: number
          stock_movement_id: number
          supplier_service_id: number
          unit_cost: number | null
        }
        Insert: {
          id?: number
          stock_movement_id: number
          supplier_service_id: number
          unit_cost?: number | null
        }
        Update: {
          id?: number
          stock_movement_id?: number
          supplier_service_id?: number
          unit_cost?: number | null
        }
        Relationships: [
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
          description: string
          id: number
          module_id: number
          situation_id: number
          status_id: number
          supplier_class_id: number
          supplier_quotation_id: number
          supplier_type_id: number
        }
        Insert: {
          description: string
          id?: number
          module_id: number
          situation_id: number
          status_id: number
          supplier_class_id: number
          supplier_quotation_id: number
          supplier_type_id: number
        }
        Update: {
          description?: string
          id?: number
          module_id?: number
          situation_id?: number
          status_id?: number
          supplier_class_id?: number
          supplier_quotation_id?: number
          supplier_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_services_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
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
          created_at: string
          email: string
          id: number
          phone: number
          supplier_type_id: number
        }
        Insert: {
          created_at?: string
          email?: string
          id: number
          phone: number
          supplier_type_id: number
        }
        Update: {
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
      types: {
        Row: {
          code: string | null
          created_at: string
          id: number
          module_id: number
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          module_id: number
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
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
          created_at: string
          id: number
          is_active: boolean
          product_cost: number | null
          product_id: number
          sku: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          product_cost?: number | null
          product_id: number
          sku?: string | null
        }
        Update: {
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
          content_json: Json | null
          created_at: string
          created_by: string
          id: number
          slug: string
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content_json?: Json | null
          created_at?: string
          created_by?: string
          id?: number
          slug: string
          title: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content_json?: Json | null
          created_at?: string
          created_by?: string
          id?: number
          slug?: string
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_edits_created_by_fkey"
            columns: ["created_by"]
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
          country_id: number
          id: number
          is_active: boolean
          name: string
          neighborhood_id: number
          state_id: number
          web: boolean
        }
        Insert: {
          address: string
          address_reference?: string | null
          city_id: number
          country_id: number
          id?: number
          is_active?: boolean
          name: string
          neighborhood_id: number
          state_id: number
          web?: boolean
        }
        Update: {
          address?: string
          address_reference?: string | null
          city_id?: number
          country_id?: number
          id?: number
          is_active?: boolean
          name?: string
          neighborhood_id?: number
          state_id?: number
          web?: boolean
        }
        Relationships: []
      }
    }
    Views: {
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
    }
    Functions: {
      add_to_cart: {
        Args: {
          p_cart_id?: string
          p_product_id: string
          p_quantity: number
          p_variation_id: string
        }
        Returns: Json
      }
      comprueba_variacion: {
        Args: { p_term_ids: number[]; p_variation_id: number }
        Returns: boolean
      }
      get_cart_details: {
        Args: { p_cart_id: string }
        Returns: {
          cart_items: Json
          total_amount: number
          total_count: number
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
      get_pos_sessions_list: {
        Args: {
          p_page?: number
          p_search?: string
          p_size?: number
          p_status_id?: number
        }
        Returns: Json
      }
      get_product_attribute_groups: {
        Args: { p_product_id: number }
        Returns: Json
      }
      get_products_list: {
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
      get_variation_by_terms: {
        Args: { p_product_id: number; terms_id: number[] }
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
      sp_close_pos_session: {
        Args: {
          p_closing_amount: number
          p_notes?: string
          p_session_id: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_create_movement: {
        Args: {
          p_amount: number
          p_branch_id: number
          p_description: string
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
          p_branch_id: number
          p_initial_situation_id: number
          p_is_existing_client?: boolean
          p_order_data: Json
          p_payments: Json
          p_products: Json
          p_user_id: string
          p_warehouse_id: number
        }
        Returns: Json
      }
      sp_create_order_chanel_type: {
        Args: {
          p_code: string
          p_module_code: string
          p_module_id: number
          p_name: string
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
        Args: {
          p_code: string
          p_location?: number
          p_name: string
          p_web?: boolean
        }
        Returns: Json
      }
      sp_create_product: {
        Args: {
          p_active: boolean
          p_categories: number[]
          p_description: string
          p_images: Json
          p_is_variable: boolean
          p_short_description: string
          p_title: string
          p_variations: Json
          p_web: boolean
        }
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
      sp_delete_payment_method: { Args: { p_id: number }; Returns: Json }
      sp_delete_price_list: { Args: { p_id: number }; Returns: Json }
      sp_delete_stock_types: { Args: { p_id: number }; Returns: Json }
      sp_ec_create_account_profile: {
        Args: {
          p_auth_uid: string
          p_dni: string
          p_lastname1: string
          p_lastname2: string
          p_nickname: string
          p_nombre: string
          p_tipo_documento_id: number
        }
        Returns: Json
      }
      sp_ec_get_customer_orders: { Args: { p_user_id: string }; Returns: Json }
      sp_ec_get_order_details: {
        Args: { p_order_id: number; p_user_id: string }
        Returns: Json
      }
      sp_ec_get_product_detail: {
        Args: { p_product_id: number }
        Returns: Json
      }
      sp_ec_get_product_ids: {
        Args: {
          p_category_id?: number
          p_product_ids?: number[]
          p_sale_price?: boolean
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
      sp_ec_get_product_list: {
        Args: {
          p_category_id?: number
          p_sale_price?: boolean
          p_search?: string
          p_size?: number
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
      sp_ec_get_user_profile: { Args: { p_user_id: string }; Returns: Json }
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
      sp_get_invoices: {
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
      sp_get_movements: {
        Args: {
          p_branches?: number
          p_bussines_account?: number
          p_class?: number
          p_end_date?: string
          p_order?: string
          p_page?: number
          p_payment_method?: number
          p_search?: string
          p_size?: number
          p_start_date?: string
          p_type?: number
        }
        Returns: Json
      }
      sp_get_order_chanel_type: {
        Args: { p_page: number; p_size: number }
        Returns: Json
      }
      sp_get_payment_method_details: { Args: { p_id: number }; Returns: Json }
      sp_get_payments_methods: {
        Args: { p_page?: number; p_search?: string; p_size?: number }
        Returns: Json
      }
      sp_get_price_list: {
        Args: { p_page?: number; p_size?: number }
        Returns: Json
      }
      sp_get_price_list_details: { Args: { p_id: number }; Returns: Json }
      sp_get_products_costs: {
        Args: {
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
      sp_get_sales_list: {
        Args: {
          p_end_date?: string
          p_order?: string
          p_page?: number
          p_sale_type?: number
          p_search?: string
          p_size?: number
          p_start_date?: string
          p_status?: string
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
          p_end_date?: string
          p_in_out?: boolean
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
      sp_get_terms: {
        Args: {
          p_group?: number
          p_max_pr?: number
          p_min_pr?: number
          p_page?: number
          p_search?: string
          p_size?: number
        }
        Returns: Json
      }
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
      sp_open_pos_session: {
        Args: {
          p_branch_id: number
          p_business_account_id?: number
          p_notes?: string
          p_opening_amount?: number
          p_user_id: string
          p_warehouse_id: number
        }
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
        Args: {
          p_code: string
          p_id: number
          p_location?: number
          p_name: string
          p_web?: boolean
        }
        Returns: Json
      }
      sp_update_state_returns: {
        Args: {
          p_apply_stock: boolean
          p_module_id: number
          p_return_id: number
          p_situation_id: number
          p_status_id: number
          p_user_id: string
        }
        Returns: Json
      }
      sp_update_stock_type: {
        Args: { p_code: string; p_id: number; p_name: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
