// Discord Guild response format
export default interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: number;
  features: [];
  permissions_new: string;
}
