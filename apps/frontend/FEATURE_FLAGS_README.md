# Role-Based UI Feature Flags

## Overview

This implementation provides a centralized feature flag system that controls UI elements based on user roles. It ensures that unauthorized users cannot see or interact with features they don't have access to, providing a clean and secure user experience.

## Features

### ✅ **Centralized Feature Management**

- **Single Source of Truth**: All feature permissions defined in one place
- **Type Safety**: Full TypeScript support with strict typing
- **Role-Based Access**: Granular control per user role
- **Custom Messages**: Descriptive error messages for each feature

### ✅ **React Integration**

- **Custom Hooks**: Easy-to-use hooks for feature checking
- **UI Components**: Pre-built components for conditional rendering
- **Automatic Updates**: UI updates automatically when user role changes

### ✅ **Developer Experience**

- **IntelliSense**: Full autocomplete for feature names
- **Error Prevention**: Compile-time checking of feature names
- **Consistent API**: Unified interface across all components

## Architecture

### Core Files

```
src/auth/
├── features.ts          # Feature flag definitions
├── useFeatures.ts       # React hooks
└── context.ts          # Auth context with user role

src/components/
├── FeatureGate.tsx     # Conditional rendering components
└── FeatureDemo.tsx     # Demo component for testing
```

### Feature Flag Structure

```typescript
interface FeatureConfig {
  enabled: boolean; // Global enable/disable
  roles: Role[]; // Allowed user roles
  message?: string; // Custom error message
}
```

## Usage

### 1. Basic Feature Checking

```tsx
import { useFeature } from '../auth/useFeatures';

const MyComponent = () => {
  const canCreateStudents = useFeature('students.create');

  return <div>{canCreateStudents && <button>Create Student</button>}</div>;
};
```

### 2. Conditional Rendering with FeatureGate

```tsx
import { FeatureGate } from '../components/FeatureGate';

const StudentsPage = () => {
  return (
    <div>
      <h1>Students</h1>

      <FeatureGate feature="students.create">
        <button>Add New Student</button>
      </FeatureGate>

      <FeatureGate feature="students.edit" fallback={<p>No edit permissions</p>}>
        <button>Edit Student</button>
      </FeatureGate>
    </div>
  );
};
```

### 3. Feature-Based Buttons

```tsx
import { FeatureButton } from '../components/FeatureGate';

const StudentActions = ({ studentId }) => {
  return (
    <div>
      <FeatureButton feature="students.edit" onClick={() => editStudent(studentId)} variant="outline" size="sm">
        Edit
      </FeatureButton>

      <FeatureButton
        feature="students.delete"
        onClick={() => deleteStudent(studentId)}
        variant="outline"
        size="sm"
        className="text-red-600"
      >
        Delete
      </FeatureButton>
    </div>
  );
};
```

### 4. Available Hooks

```tsx
import { useFeature, useCan, useCannot, useAvailableFeatures } from '../auth/useFeatures';

const MyComponent = () => {
  const canEdit = useCan('students.edit');
  const cannotDelete = useCannot('students.delete');
  const availableFeatures = useAvailableFeatures();

  return (
    <div>
      <p>Can edit: {canEdit ? 'Yes' : 'No'}</p>
      <p>Cannot delete: {cannotDelete ? 'Yes' : 'No'}</p>
      <p>Available features: {availableFeatures.length}</p>
    </div>
  );
};
```

## Available Features

### Student Management

- `students.view` - View student list (admin, teacher)
- `students.create` - Create new students (admin)
- `students.edit` - Edit student information (admin)
- `students.delete` - Delete students (admin)

### Teacher Management

- `teachers.view` - View teacher list (admin)
- `teachers.create` - Create new teachers (admin)
- `teachers.edit` - Edit teacher information (admin)
- `teachers.delete` - Delete teachers (admin)

### Class Management

- `classes.view` - View classes (all roles)
- `classes.create` - Create new classes (admin)
- `classes.edit` - Edit classes (admin, teacher)
- `classes.delete` - Delete classes (admin)
- `classes.enroll` - Enroll students (admin)

### Grades

- `grades.view` - View grades (all roles)
- `grades.edit` - Edit grades (admin, teacher)
- `grades.export` - Export grades (admin, teacher)

### Attendance

- `attendance.view` - View attendance (all roles)
- `attendance.take` - Take attendance (admin, teacher)
- `attendance.edit` - Edit attendance (admin, teacher)

### Materials

- `materials.view` - View materials (all roles)
- `materials.upload` - Upload materials (admin, teacher)
- `materials.edit` - Edit materials (admin, teacher)
- `materials.delete` - Delete materials (admin, teacher)

### Announcements

- `announcements.view` - View announcements (all roles)
- `announcements.create` - Create announcements (admin, teacher)
- `announcements.edit` - Edit announcements (admin, teacher)
- `announcements.delete` - Delete announcements (admin, teacher)
- `announcements.publish` - Publish announcements (admin, teacher)

### Finance

- `finance.view` - View finance info (admin, parent)
- `finance.create` - Create finance records (admin)
- `finance.edit` - Edit finance records (admin)
- `finance.delete` - Delete finance records (admin)

### Schedule

- `schedule.view` - View schedules (all roles)
- `schedule.edit` - Edit schedules (admin)

### Reports

- `reports.view` - View reports (admin, teacher)
- `reports.export` - Export reports (admin, teacher)

### Settings

- `settings.view` - View settings (admin)
- `settings.edit` - Edit settings (admin)

## Role Hierarchy

### Admin

- Full access to all features
- Can manage users, classes, and system settings
- Can view and export all data

### Teacher

- Can view and manage their classes
- Can take attendance and manage grades
- Can create and manage announcements
- Can upload and manage materials

### Student

- Can view their own grades and attendance
- Can view class materials and announcements
- Can view their schedule

### Parent

- Can view their child's grades and attendance
- Can view finance information
- Can view announcements and materials

## Testing

### Feature Demo Component

The `FeatureDemo` component on the dashboard provides a visual way to test the feature flag system:

1. **User Information**: Shows current user and role
2. **Feature Groups**: Organized by functionality
3. **Visual Indicators**: Green for available, hidden for unavailable
4. **Interactive Testing**: Test buttons for each feature

### Manual Testing

```tsx
// Test specific features
const canCreate = useFeature('students.create');
console.log('Can create students:', canCreate);

// Test all available features
const available = useAvailableFeatures();
console.log('Available features:', available);
```

## Best Practices

### 1. Use Feature Gates for UI Elements

```tsx
// ✅ Good
<FeatureGate feature="students.create">
  <button>Create Student</button>
</FeatureGate>;

// ❌ Avoid
{
  user?.role === 'admin' && <button>Create Student</button>;
}
```

### 2. Use Feature Buttons for Actions

```tsx
// ✅ Good
<FeatureButton feature="students.delete" onClick={handleDelete}>
  Delete
</FeatureButton>;

// ❌ Avoid
{
  user?.role === 'admin' && <button onClick={handleDelete}>Delete</button>;
}
```

### 3. Provide Fallbacks

```tsx
// ✅ Good
<FeatureGate feature="students.edit" fallback={<p>No edit permissions</p>}>
  <button>Edit</button>
</FeatureGate>
```

### 4. Use Descriptive Messages

```tsx
// ✅ Good
'students.create': {
  enabled: true,
  roles: ['admin'],
  message: 'Only administrators can create new students',
}

// ❌ Avoid
'students.create': {
  enabled: true,
  roles: ['admin'],
  message: 'Access denied',
}
```

## Extending the System

### Adding New Features

1. **Define the feature** in `features.ts`:

```typescript
export type FeatureKey = 'existing.feature' | 'new.feature'; // Add here

export const FEATURE_FLAGS: Record<FeatureKey, FeatureConfig> = {
  // ... existing features
  'new.feature': {
    enabled: true,
    roles: ['admin', 'teacher'],
    message: 'Only administrators and teachers can access this feature',
  },
};
```

2. **Use in components**:

```tsx
<FeatureGate feature="new.feature">
  <NewFeatureComponent />
</FeatureGate>
```

### Adding New Roles

1. **Update the Role type** in `context.ts`:

```typescript
export type Role = 'student' | 'parent' | 'teacher' | 'admin' | 'newrole';
```

2. **Update feature configurations** to include the new role where appropriate.

## Security Notes

- **Client-Side Only**: This system is for UI control only
- **Server Validation**: Always validate permissions on the server
- **No Sensitive Data**: Don't rely on feature flags for data protection
- **Graceful Degradation**: Provide fallbacks for unauthorized users

## Performance

- **Minimal Overhead**: Feature checking is fast and cached
- **No Network Calls**: All logic runs client-side
- **Automatic Updates**: UI updates when user context changes
- **Tree Shaking**: Unused features are removed in production builds
