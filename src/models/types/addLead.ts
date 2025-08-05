interface AddLeadBody {
  name: string;
  price?: number;
  responsible_user_id?: number;
  pipeline_id?: number;
  status_id?: number;
  tags?: {
    name: string;
  }[];
  custom_fields_values?: {
    field_id: number;
    values: {
      value: string | number | boolean;
    }[];
  }[];
  _embedded?: {
    contacts?: {
      first_name?: string;
      last_name?: string;
      custom_fields_values?: {
        field_id?: number;
        field_name?: string;
        field_code?: string;
        values: {
          value: string | number | boolean;
        }[];
      }[];
    }[];
    companies?: {
      name: string;
    }[];
  };
}
export type AddLeadArray = AddLeadBody[];
