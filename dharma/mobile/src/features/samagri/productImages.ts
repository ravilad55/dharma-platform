import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import BrassDiyaSet from "../../../assets/pooja-samagri/brass-diya-set.svg";
import GrihaPraveshKit from "../../../assets/pooja-samagri/griha-pravesh-kit.svg";
import MarigoldFlowers from "../../../assets/pooja-samagri/marigold-flowers.svg";
import SandalwoodIncense from "../../../assets/pooja-samagri/sandalwood-incense.svg";
import SatyanarayanKit from "../../../assets/pooja-samagri/satyanarayan-kit.svg";

const localProductImages: Record<string, ComponentType<SvgProps>> = {
  "catalog/brass-diya-set.png": BrassDiyaSet,
  "catalog/griha-pravesh-kit.png": GrihaPraveshKit,
  "catalog/marigold-flowers.png": MarigoldFlowers,
  "catalog/sandalwood-incense.png": SandalwoodIncense,
  "catalog/satyanarayan-kit.png": SatyanarayanKit,
};

export function getLocalProductImage(imageReference?: string | null) {
  if (!imageReference) return undefined;
  return localProductImages[imageReference];
}
