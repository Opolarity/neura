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
      business_accounts: {
        Row: {
          account_number: number | null
          bank: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          account_number?: number | null
          bank: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          account_number?: number | null
          bank?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      capabilities: {
        Row: {
          code: string | null
          id: number
          name: string
        }
        Insert: {
          code?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string | null
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
        }
        Insert: {
          description?: string | null
          id?: number
          image_url?: string | null
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          image_url?: string | null
          name?: string
        }
        Relationships: []
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
      clients: {
        Row: {
          created_at: string
          document_number: string
          document_type_id: number
          id: number
          last_name: string
          last_name2: string | null
          middle_name: string | null
          name: string
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type_id: number
          id?: number
          last_name: string
          last_name2?: string | null
          middle_name?: string | null
          name: string
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type_id?: number
          id?: number
          last_name?: string
          last_name2?: string | null
          middle_name?: string | null
          name?: string
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
      document_types: {
        Row: {
          code: string | null
          created_at: string
          id: number
          max_length: number | null
          min_length: number | null
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: number
          max_length?: number | null
          min_length?: number | null
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: number
          max_length?: number | null
          min_length?: number | null
          name?: string
        }
        Relationships: []
      }
      functions: {
        Row: {
          active: boolean
          capability_id: number
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
          capability_id: number
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
          capability_id?: number
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
            foreignKeyName: "fk_functions_capability_id_capabilities_id"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "functions_parent_function_fkey"
            columns: ["parent_function"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          crated_at: string
          id: number
          invoice_type_id: number
          order_id: number
        }
        Insert: {
          crated_at: string
          id: number
          invoice_type_id: number
          order_id: number
        }
        Update: {
          crated_at?: string
          id?: number
          invoice_type_id?: number
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_invoice_type_id_invoice_type_id"
            columns: ["invoice_type_id"]
            isOneToOne: false
            referencedRelation: "invoice_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoice_order_id_orders_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_type: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
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
      movement_categories: {
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
      movement_types: {
        Row: {
          code: string | null
          id: number
          name: string
        }
        Insert: {
          code?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      movements: {
        Row: {
          amount: number
          business_account_id: number
          created_at: string
          description: string | null
          id: number
          movement_category_id: number
          movement_date: string
          movement_type_id: number
          payment_method_id: number
          user_id: string | null
          warehouse_id: number
        }
        Insert: {
          amount: number
          business_account_id: number
          created_at?: string
          description?: string | null
          id?: number
          movement_category_id: number
          movement_date: string
          movement_type_id: number
          payment_method_id: number
          user_id?: string | null
          warehouse_id: number
        }
        Update: {
          amount?: number
          business_account_id?: number
          created_at?: string
          description?: string | null
          id?: number
          movement_category_id?: number
          movement_date?: string
          movement_type_id?: number
          payment_method_id?: number
          user_id?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "movements_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_movement_category_id_fkey"
            columns: ["movement_category_id"]
            isOneToOne: false
            referencedRelation: "movement_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_movement_type_id_fkey"
            columns: ["movement_type_id"]
            isOneToOne: false
            referencedRelation: "movement_types"
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
          {
            foreignKeyName: "movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
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
          created_at: string
          id: number
          image_url: string | null
          message: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          message?: string | null
          user_id?: string
        }
        Update: {
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
      oder_notes: {
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
          order_id: number
          payment_method_id: number
        }
        Insert: {
          amount: number
          date: string
          gateway_confirmation_code?: string | null
          id?: number
          order_id: number
          payment_method_id: number
        }
        Update: {
          amount?: number
          date?: string
          gateway_confirmation_code?: string | null
          id?: number
          order_id?: number
          payment_method_id?: number
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
        ]
      }
      order_products: {
        Row: {
          id: number
          order_id: number
          product_discount: number
          product_price: number
          product_variation_id: number
          quantity: number
          reservation: boolean
          warehouses_id: number
        }
        Insert: {
          id?: number
          order_id: number
          product_discount?: number
          product_price: number
          product_variation_id: number
          quantity: number
          reservation?: boolean
          warehouses_id?: number
        }
        Update: {
          id?: number
          order_id?: number
          product_discount?: number
          product_price?: number
          product_variation_id?: number
          quantity?: number
          reservation?: boolean
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
          id: number
          last_row: boolean
          order_id: number
          situation_id: number
          status_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          last_row: boolean
          order_id: number
          situation_id: number
          status_id: number
        }
        Update: {
          created_at?: string
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
          reception_person: string | null
          reception_phone: number | null
          sale_type: number
          shipping_method: number | null
          state_id: number | null
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_reference?: string | null
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
          reception_person?: string | null
          reception_phone?: number | null
          sale_type: number
          shipping_method?: number | null
          state_id?: number | null
          subtotal: number
          total: number
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_reference?: string | null
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
          reception_person?: string | null
          reception_phone?: number | null
          sale_type?: number
          shipping_method?: number | null
          state_id?: number | null
          subtotal?: number
          total?: number
          user_id?: string | null
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
            foreignKeyName: "orders_neighborhood_id_city_id_state_id_country_id_fkey"
            columns: ["neighborhood_id", "city_id", "state_id", "country_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id", "city_id", "state_id", "country_id"]
          },
          {
            foreignKeyName: "orders_sale_type_fkey"
            columns: ["sale_type"]
            isOneToOne: false
            referencedRelation: "sale_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_method_fkey"
            columns: ["shipping_method"]
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
      payment_methods: {
        Row: {
          active: boolean
          business_account_id: number | null
          id: number
          name: string
        }
        Insert: {
          active: boolean
          business_account_id?: number | null
          id?: number
          name: string
        }
        Update: {
          active?: boolean
          business_account_id?: number | null
          id?: number
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
      price_list: {
        Row: {
          code: string | null
          created_at: string | null
          id: number
          location: number
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: number
          location?: number
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: number
          location?: number
          name?: string
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
          id: number
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
          id: number
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
          defects: number
          id: number
          product_variation_id: number
          stock: number
          warehouse_id: number
        }
        Insert: {
          defects?: number
          id?: number
          product_variation_id: number
          stock: number
          warehouse_id: number
        }
        Update: {
          defects?: number
          id?: number
          product_variation_id?: number
          stock?: number
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
          id: number
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
          is_variable?: boolean
          short_description?: string
          title?: string
          web?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          address: string | null
          address_reference: string | null
          city_id: number | null
          client_id: number
          country_id: number | null
          created_at: string | null
          document_number: string
          document_type: number
          last_name: string
          last_name2: string
          middle_name: string | null
          name: string
          neighborhood_id: number | null
          state_id: number | null
          UID: string
          warehouse_id: number
        }
        Insert: {
          active: boolean
          address?: string | null
          address_reference?: string | null
          city_id?: number | null
          client_id: number
          country_id?: number | null
          created_at?: string | null
          document_number: string
          document_type: number
          last_name: string
          last_name2: string
          middle_name?: string | null
          name: string
          neighborhood_id?: number | null
          state_id?: number | null
          UID: string
          warehouse_id?: number
        }
        Update: {
          active?: boolean
          address?: string | null
          address_reference?: string | null
          city_id?: number | null
          client_id?: number
          country_id?: number | null
          created_at?: string | null
          document_number?: string
          document_type?: number
          last_name?: string
          last_name2?: string
          middle_name?: string | null
          name?: string
          neighborhood_id?: number | null
          state_id?: number | null
          UID?: string
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_document_type_fkey"
            columns: ["document_type"]
            isOneToOne: false
            referencedRelation: "document_types"
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
      returns: {
        Row: {
          created_at: string | null
          created_by: string
          customer_document_number: string
          customer_document_type_id: number | null
          id: number
          order_id: number
          reason: string | null
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
          order_id: number
          reason?: string | null
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
          order_id?: number
          reason?: string | null
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
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
        }
        Insert: {
          created_at?: string | null
          id?: never
          output?: boolean
          product_amount?: number | null
          product_variation_id: number
          quantity: number
          return_id: number
        }
        Update: {
          created_at?: string | null
          id?: never
          output?: boolean
          product_amount?: number | null
          product_variation_id?: number
          quantity?: number
          return_id?: number
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
          created_at: string
          id: number
          module_id: number
          name: string
          status_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          module_id: number
          name: string
          status_id: number
        }
        Update: {
          created_at?: string
          id?: number
          module_id?: number
          name?: string
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
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string
          id: number
          manual_movement: boolean
          order_id: number | null
          product_variation_id: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: never
          manual_movement: boolean
          order_id?: number | null
          product_variation_id: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: never
          manual_movement?: boolean
          order_id?: number | null
          product_variation_id?: number
          quantity?: number
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
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
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
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      terms: {
        Row: {
          id: number
          name: string
          term_group_id: number | null
        }
        Insert: {
          id?: number
          name: string
          term_group_id?: number | null
        }
        Update: {
          id?: number
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
          product_cost: number | null
          product_id: number
          sku: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          product_cost?: number | null
          product_id: number
          sku?: string | null
        }
        Update: {
          created_at?: string
          id?: number
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
      warehouses: {
        Row: {
          city_id: number
          country_id: number
          id: number
          name: string
          neighborhood_id: number
          state_id: number
          street: string
          web: boolean
        }
        Insert: {
          city_id: number
          country_id: number
          id?: number
          name: string
          neighborhood_id: number
          state_id: number
          street: string
          web?: boolean
        }
        Update: {
          city_id?: number
          country_id?: number
          id?: number
          name?: string
          neighborhood_id?: number
          state_id?: number
          street?: string
          web?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_product_attribute_groups: {
        Args: { p_product_id: number }
        Returns: Json
      }
      get_variation_by_terms: {
        Args: { p_product_id: number; terms_id: number[] }
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
