import { http, HttpResponse } from 'msw'

export const handlers = [
  // User Registration
  http.post('/api/users/register', async ({ request }) => {
    const formData = await request.formData()
    const accountType = formData.get('accountType')

    return HttpResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: {
          id: 'test-user-id',
          email: formData.get('email'),
        },
      },
      { status: 201 }
    )
  }),

  // Application Creation
  http.post('/api/applications', async () => {
    return HttpResponse.json(
      {
        application: {
          id: 'test-app-id',
          applicationNo: 'PGIN-2025-12-001',
          status: 'DRAFT',
          currentStep: 1,
        },
      },
      { status: 201 }
    )
  }),

  // Application Draft Save
  http.put('/api/applications/:id/draft', async ({ params, request }) => {
    const body = await request.json() as any
    return HttpResponse.json(
      {
        success: true,
        application: {
          id: params.id,
          ...body,
        },
      },
      { status: 200 }
    )
  }),

  // Application Submit
  http.post('/api/applications/:id/submit', async ({ params }) => {
    return HttpResponse.json(
      {
        success: true,
        application: {
          id: params.id,
          status: 'SUBMITTED',
        },
      },
      { status: 200 }
    )
  }),

  // Get Application
  http.get('/api/applications/:id', async ({ params }) => {
    return HttpResponse.json(
      {
        application: {
          id: params.id,
          applicationNo: 'PGIN-2025-12-001',
          status: 'DRAFT',
          currentStep: 1,
          projectName: 'Test Project',
        },
      },
      { status: 200 }
    )
  }),
]
