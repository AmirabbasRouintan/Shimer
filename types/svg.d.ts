// types/svg.d.ts
declare module "*.svg" {
  import { ImageSourcePropType } from "react-native";
  const content: ImageSourcePropType;
  export default content;
}
