const multipart = require('parse-multipart')
const { Octokit } = require('@octokit/rest')
const fetch = require('isomorphic-fetch')

const OWNER = 'franknoirot'
const REPO = 'franknoirot.co'
const POST_FOLDER = 'posts'

const now = new Date()
const padZ = (int, zeros) => int.toString().padStart(zeros, '0')
const date = `${now.getFullYear()}-${padZ(now.getMonth(), 2)}-${padZ(now.getDate(), 2)}`

function postMeta(title, slug) {
    return `---\ntitle: "${ title }"\nslug: "${ slug }"\nlayout: "layouts/post.njk"\ndate: ${ now.toISOString() }\ntags:\n  - post\n  - code\n---\n\n`
}

exports.handler = async function (event, context, callback) {
    if (event.method === 'OPTIONS') {
        callback(null, {
            statusCode: 200,
            headers: {
                'Control-Access-Allow-Origin': '*',
            }
        })
    }

    try {
        console.log('event.body = ', event.body)

        // get post's content and user's auth info
        const contentType = event.headers['content-type']

        const boundary = contentType.match(/boundary=(.*)$/)
        let parts
        if (boundary) {
            parts = Object.fromEntries(event.body.split(boundary).map(partStr => {
                const key = partStr.match(/name="(.*)"/)
                const value = partStr.match(/name=".*"\r\n\r\n((.|\n)*)/)
                if (key && value) {
                    return [key[1],value[1]]
                } else {
                    return false
                }
            }).filter(x => x && x !== null))
        } else {
            parts = Object.fromEntries(decodeURIComponent(event.body).split('&').map(keyValPair => [...keyValPair.split('=')]))
        }

        // uhh Netlify Identity just comes for free with the request????
        const { user } = context.clientContext

        // if invalid user, return failure state
        if (!user || !user.hasOwnProperty('me') || !user.me || !parts.hasOwnProperty('content') || !parts.content) {
            callback(new Error("malformed authentication"), {
                statusCode: 403,
                body: "Forbidden: malformed authentication",
            })

            return 
        }

        // if valid user, add contents to GitHub repo as a Markdown (or HTML) file
        const octo = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        })

        let title = parts.title
        if (!title) {
            title = parts.content.match(/# (.*)\n\n/)
        }
        
        if (title) {
            title = title[1]
            parts.content = parts.content.replace(/# (.*)\n\n/, '')
        } else {
            title = `Post ${date}`
        }

        parts.content = postMeta(title, parts.slug) + parts.content

        const filePath = POST_FOLDER + '/' + ((parts.slug) ? parts.slug + '.md' : `${date}--${now.getHours}-${now.getMinutes}-${now.getSeconds}.md`)

        console.log(parts.content)

        // push commit to GitHub repo
        await uploadToRepo(octo, title, filePath, parts.content, OWNER, REPO)

        callback(null, {
            statusCode: 201,
            body: 'Post created! Site rebuilding',
        })
    } catch(err) {
        console.error(err)
        callback(err, {
            statusCode: 502,
            body: JSON.stringify(err),
        })
    }
} 

async function uploadToRepo(octo, path, content, owner, repo, branch = `master`) {
    const currCommit = await getCurrCommit(octo, owner, repo, branch)
    const fileBlob = await createBlobForFile(octo, content, owner, repo)
    console.log('fileBlob = ', fileBlob)
    const newTree = await createNewTree(
        octo,
        owner,
        repo,
        fileBlob,
        path,
        currCommit.treeSha
    )
    console.log('newTree = ', newTree)
    const commitMessage = `New post published via MicroPub: ${ title }`
    const newCommit = await createNewCommit(
        octo,
        owner,
        repo,
        commitMessage,
        newTree.sha,
        currCommit.commitSha,
    )
    console.log('newCommit = ', newCommit)

    await setBranchToCommit(octo, owner, repo, branch, newCommit.sha)
    console.log('Done!')
}

async function getCurrCommit(octo, owner, repo, branch = `master`) {
    const { data: refData } = await octo.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
    })
    const commitSha = refData.object.sha
    const { data: commitData } = await octo.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha,
    })
    return {
        commitSha,
        treeSha: commitData.tree.sha,
    }
}

async function createBlobForFile(octo, content, owner, repo) {
    const blobData = await octo.git.createBlob({
        owner,
        repo,
        content,
        encoding: 'utf-8',
    })
    return blobData.data
}

async function createNewTree(octo, owner, repo, blob, path, parentTreeSha) {
    const tree = [{
        path,
        mode: `100644`,
        type: `blob`,
        sha: blob.sha,
    }]
    const { data } = await octo.git.createTree({
        owner,
        repo,
        tree,
        base_tree: parentTreeSha,
    })
    return data
}

async function createNewCommit(octo, owner, repo, message, currTreeSha, currCommitSha) {
    return (await octo.git.createCommit({
        owner,
        repo,
        message,
        tree: currTreeSha,
        parents: [currCommitSha],
    })).data
}

function setBranchToCommit(octo, owner, repo, branch = `master`, commitSha) {
    octo.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: commitSha,
    })
}