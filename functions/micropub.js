const Octokit = require('@octokit/rest')
const fetch = require('isomorphic-fetch')
const qs = require('querystring')

const OWNER = 'franknoirot'
const REPO = 'franknoirot.co'
const POST_FOLDER = './posts'


exports.handler = async function (event, context, callback) {
    console.log('event', event)

    // get post's content and user's auth info
    const postJSON = qs.parse(event.body)

    console.log('data is ', postJSON)

    // verify user's auth token via IndieAuth
    const authRes = await fetch('https://tokens.indieauth.com/token', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': event.headers.Authorization,
        }
    }).then(res => await res.json())
    .catch(err => console.error(err))

    console.log('authRes = ', authRes)

    // if invalid user, return failure state
    if (!authRes || !authRes.hasOwnProperty('me') || !authRes.me || !postJSON.hasOwnProperty('content') || !postJSON.content) {
        callback(new Error("malformed authentication"), {
            statusCode: 401,
            body: "Unauthorized: malformed authentication",
        })

        return 
    }

    // if valid user, add contents to GitHub repo as a Markdown (or HTML) file
    const octo = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    })

    // push commit to GitHub repo
    await uploadToRepo(octo, POST_FOLDER, postJSON.content, OWNER, REPO)

    callback(null, {
        statusCode: 201,
        body: 'Post created! Site rebuilding',
    })
} 

async function uploadToRepo(octo, path, content, owner, repo, branch = `master`) {
    const currCommit = await getCurrCommit(octo, owner, repo, branch)
    const fileBlob = await createBlobForFile(octo, content, org, repo)
    const newTree = await createNewTree(
        octo,
        owner,
        repo,
        fileBlob,
        path,
        currCommit.treeSha
    )
    const commitMessage = `New post published via MicroPub!`
    const newCommit = await createNewCommit(
        octo,
        owner,
        repo,
        commitMessage,
        newTree.sha,
        currCommit.commitSha,
    )

    await setBranchToCommit(octo, owner, repo, branch, newCommit.sha)

}

async function getCurrCommit(octo, owner, repo, branch = `master`) {
    const { data: refData } = awawit octo.git.getRef({
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

async function createBlobForFile(octo, content, org, repo) {
    const blobData = await octo.git.createBlob({
        owner,
        repo,
        content,
        encoding: 'utf-8',
    })
    return blobData.data
}

function createNewTree(octo, owner, repo, blob, path, parentTreeSha) {
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
    (await octo.git.createCommit({
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