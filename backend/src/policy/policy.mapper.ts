import { PolicyCategory } from './schemas/policy-category.schema';
import {
  PolicyVersion,
  PolicyVersionDocument,
} from './schemas/policy-version.schema';
import {
  AdminPolicyResponseDto,
  EnabledCategoriesResponseDto,
  PolicyCategoryResponseDto,
  PolicyVersionResponseDto,
} from './dto/policy-response.dto';
import { PolicyCategoryInputDto } from './dto/update-policy.dto';

export function toPolicyCategoryResponse(
  category: PolicyCategory,
): PolicyCategoryResponseDto {
  return {
    name: category.name,
    enabled: category.enabled,
    confidenceThreshold: category.confidenceThreshold,
    enforcement: category.enforcement,
  };
}

export function toPolicyVersionResponse(
  policy: PolicyVersionDocument,
): PolicyVersionResponseDto {
  return {
    id: policy._id.toString(),
    version: policy.version,
    isActive: policy.isActive,
    createdBy: policy.createdBy.toString(),
    categories: policy.categories.map(toPolicyCategoryResponse),
    createdAt: policy.createdAt,
  };
}

export function toEnabledCategoriesResponse(
  categories: PolicyCategory[],
): EnabledCategoriesResponseDto {
  return {
    categories: categories.filter((category) => category.enabled).map((c) => c.name),
  };
}

export function toAdminPolicyResponse(
  active: PolicyVersionDocument,
  history: PolicyVersionDocument[],
): AdminPolicyResponseDto {
  return {
    active: toPolicyVersionResponse(active),
    history: history.map(toPolicyVersionResponse),
  };
}

export function mapCategoryInputs(
  categories: PolicyCategoryInputDto[],
): PolicyCategory[] {
  return categories.map((category) => ({
    name: category.name,
    enabled: category.enabled,
    confidenceThreshold: category.confidenceThreshold,
    enforcement: category.enforcement,
  }));
}

export type PublishPolicyVersionInput = Pick<
  PolicyVersion,
  'version' | 'isActive' | 'createdBy' | 'categories'
>;
