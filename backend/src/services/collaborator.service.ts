import prisma from '../db/prisma.js'

export interface CollaboratorInput {
  name: string
  phone: string
}

export function listCollaborators() {
  return prisma.collaborator.findMany({ orderBy: { name: 'asc' } })
}

export function getCollaboratorById(id: string) {
  return prisma.collaborator.findUnique({ where: { id } })
}

export function createCollaborator(data: CollaboratorInput) {
  return prisma.collaborator.create({ data })
}

export function updateCollaborator(id: string, data: Partial<CollaboratorInput>) {
  return prisma.collaborator.update({ where: { id }, data })
}

export function deleteCollaborator(id: string) {
  return prisma.collaborator.delete({ where: { id } })
}
